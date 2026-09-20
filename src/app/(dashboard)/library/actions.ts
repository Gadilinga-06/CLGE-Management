/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

async function getFineRate(supabase: any, collegeId: string): Promise<{ fine_per_day: number; max_fine: number | null; grace_days: number }> {
  const { data } = await supabase
    .from("library_fine_rules")
    .select("fine_per_day, max_fine, grace_days")
    .eq("college_id", collegeId)
    .single();
  return data || { fine_per_day: 2, max_fine: null, grace_days: 0 };
}

function calcFineAmount(dueDate: string, returnDate: string, rule: { fine_per_day: number; max_fine: number | null; grace_days: number }): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const daysLate = Math.ceil((ret.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  const overdue = Math.max(0, daysLate - rule.grace_days);
  if (overdue === 0) return 0;
  const raw = overdue * rule.fine_per_day;
  return rule.max_fine ? Math.min(raw, rule.max_fine) : raw;
}

// ─────────────────────────────────────────
// BOOKS CRUD
// ─────────────────────────────────────────

export async function addBook(formData: FormData) {
  const ctx = await requirePermission("library.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    title: formData.get("title") as string,
    author: formData.get("author") as string || null,
    isbn: formData.get("isbn") as string || null,
    publisher: formData.get("publisher") as string || null,
    category: formData.get("category") as string || null,
    edition: formData.get("edition") as string || null,
    total_copies: parseInt(formData.get("total_copies") as string) || 1,
  };

  if (!payload.title) return { error: "Title is required." };
  if (payload.total_copies < 1) return { error: "Must have at least 1 copy." };

  const { data: book, error } = await supabase.from("books").insert(payload).select().single();
  if (error) return { error: "Failed to add book" };

  const copies = Array.from({ length: payload.total_copies }, (_, i) => ({
    book_id: book.id,
    accession_number: `${book.isbn || book.id.slice(0, 6).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
    status: "AVAILABLE",
  }));

  const { error: copyErr } = await supabase.from("book_copies").insert(copies);
  if (copyErr) return { error: "Failed to create book copies" };

  await logAudit(ctx.user.id, "CREATE", "books", book.id, null, payload);
  revalidatePath("/library");
  revalidatePath("/library/books");
  return { success: true };
}

export async function updateBook(id: string, formData: FormData) {
  const ctx = await requirePermission("library.manage");
  const supabase = createAdminClient();

  const updates = {
    title: formData.get("title") as string,
    author: formData.get("author") as string || null,
    isbn: formData.get("isbn") as string || null,
    publisher: formData.get("publisher") as string || null,
    category: formData.get("category") as string || null,
    edition: formData.get("edition") as string || null,
  };

  if (!updates.title) return { error: "Title is required." };

  const { error } = await supabase.from("books").update(updates).eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: "Failed to update book" };

  await logAudit(ctx.user.id, "UPDATE", "books", id, null, updates);
  revalidatePath("/library");
  revalidatePath("/library/books");
  return { success: true };
}

export async function deleteBook(id: string) {
  const ctx = await requirePermission("library.manage");
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("book_copies")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id)
    .eq("status", "ISSUED");

  if ((count || 0) > 0) return { error: "Cannot delete a book with copies currently issued." };

  const { error } = await supabase.from("books").delete().eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: "Failed to delete book" };

  await logAudit(ctx.user.id, "DELETE", "books", id, null, null);
  revalidatePath("/library");
  revalidatePath("/library/books");
  return { success: true };
}

// ─────────────────────────────────────────
// ISSUE & RETURN
// ─────────────────────────────────────────

export async function issueBook(payload: { member_id: string; copy_id: string; due_date: string }) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  // Verify copy belongs to user's college via book → college_id
  const { data: copy } = await supabase
    .from("book_copies")
    .select("status, book_id, books!inner(college_id)")
    .eq("id", payload.copy_id)
    .single();

  if (!copy) return { error: "Book copy not found." };
  if ((copy as any).books?.college_id !== collegeId) return { error: "Book copy not found in your college." };
  if (copy.status !== "AVAILABLE") return { error: "This copy is not available for issue." };

  // Verify member belongs to user's college
  const { data: member } = await supabase
    .from("library_members")
    .select("max_books, status, college_id")
    .eq("id", payload.member_id)
    .single();

  if (!member || member.status !== "ACTIVE") return { error: "Member is not active." };
  if (member.college_id !== collegeId) return { error: "Member not found in your college." };

  const { count: currentlyIssued } = await supabase
    .from("library_transactions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", payload.member_id)
    .eq("status", "ISSUED");

  if ((currentlyIssued || 0) >= (member?.max_books || 3)) {
    return { error: `Member has reached their borrowing limit of ${member?.max_books || 3} books.` };
  }

  const { count: dupCount } = await supabase
    .from("library_transactions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", payload.member_id)
    .eq("copy_id", payload.copy_id)
    .eq("status", "ISSUED");

  if ((dupCount || 0) > 0) return { error: "This copy is already issued to this member." };

  const { data: tx, error: txErr } = await supabase
    .from("library_transactions")
    .insert({
      college_id: collegeId,
      member_id: payload.member_id,
      copy_id: payload.copy_id,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: payload.due_date,
      status: "ISSUED",
    })
    .select()
    .single();

  if (txErr) return { error: "Failed to issue book" };

  await supabase.from("book_copies").update({ status: "ISSUED" }).eq("id", payload.copy_id);

  await logAudit(ctx.user.id, "CREATE", "library_transactions", tx.id, null, payload);
  revalidatePath("/library/transactions");
  revalidatePath("/library");
  return { success: true };
}

export async function returnBook(transactionId: string, notes?: string) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const { data: tx } = await supabase
    .from("library_transactions")
    .select("id, copy_id, due_date, status, member_id, college_id")
    .eq("id", transactionId)
    .single();

  if (!tx) return { error: "Transaction not found." };
  if (tx.college_id !== collegeId) return { error: "Transaction not found in your college." };
  if (tx.status === "RETURNED") return { error: "This book has already been returned." };

  const returnDate = new Date().toISOString().split("T")[0];

  const fineRule = await getFineRate(supabase, collegeId);
  const fineAmount = calcFineAmount(tx.due_date, returnDate, fineRule);

  await supabase
    .from("library_transactions")
    .update({ status: "RETURNED", return_date: returnDate, notes: notes || null })
    .eq("id", transactionId)
    .eq("college_id", collegeId);

  await supabase.from("book_copies").update({ status: "AVAILABLE" }).eq("id", tx.copy_id);

  if (fineAmount > 0) {
    await supabase.from("library_fines").insert({
      transaction_id: transactionId,
      college_id: collegeId,
      amount: fineAmount,
      status: "UNPAID",
    });
  }

  const { data: copy } = await supabase.from("book_copies").select("book_id").eq("id", tx.copy_id).single();
  if (copy) {
    const { data: reservations } = await supabase
      .from("book_reservations")
      .select("id, member_id")
      .eq("book_id", copy.book_id)
      .eq("status", "ACTIVE")
      .order("reserved_at", { ascending: true })
      .limit(1);

    if (reservations && reservations.length > 0) {
      await logAudit(ctx.user.id, "NOTIFY", "book_reservations", reservations[0].id, null, { message: "Book is now available" });
    }
  }

  await logAudit(ctx.user.id, "UPDATE", "library_transactions", transactionId, { status: "ISSUED" }, { status: "RETURNED", fine: fineAmount });
  revalidatePath("/library/transactions");
  revalidatePath("/library");
  return { success: true, fineAmount };
}

export async function renewBook(transactionId: string, newDueDate: string) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const { data: tx } = await supabase
    .from("library_transactions")
    .select("id, status, renewal_count, due_date, college_id")
    .eq("id", transactionId)
    .single();

  if (!tx) return { error: "Transaction not found." };
  if (tx.college_id !== collegeId) return { error: "Transaction not found in your college." };
  if (tx.status !== "ISSUED") return { error: "Only currently issued books can be renewed." };
  if ((tx.renewal_count || 0) >= 2) return { error: "Maximum renewals (2) reached for this issue." };

  const newDate = new Date(newDueDate);
  const today = new Date();
  if (newDate <= today) return { error: "New due date must be in the future." };

  await supabase
    .from("library_transactions")
    .update({
      due_date: newDueDate,
      renewal_count: (tx.renewal_count || 0) + 1,
    })
    .eq("id", transactionId)
    .eq("college_id", collegeId);

  await logAudit(ctx.user.id, "UPDATE", "library_transactions", transactionId, { due_date: tx.due_date }, { due_date: newDueDate });
  revalidatePath("/library/transactions");
  return { success: true };
}

// ─────────────────────────────────────────
// RESERVATIONS
// ─────────────────────────────────────────

export async function reserveBook(bookId: string, memberId: string) {
  const ctx = await requirePermission("library.view");
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("book_reservations")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("member_id", memberId)
    .eq("status", "ACTIVE");

  if ((count || 0) > 0) return { error: "You already have an active reservation for this book." };

  const { data: copies } = await supabase
    .from("book_copies")
    .select("id")
    .eq("book_id", bookId)
    .eq("status", "AVAILABLE");

  if (copies && copies.length > 0) {
    return { error: "This book is currently available. Please issue it directly." };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);

  const { error } = await supabase.from("book_reservations").insert({
    college_id: ctx.profile.college_id,
    book_id: bookId,
    member_id: memberId,
    expires_at: expiresAt.toISOString(),
    status: "ACTIVE",
  });

  if (error) return { error: "Failed to reserve book" };
  revalidatePath("/library");
  return { success: true };
}

export async function cancelReservation(reservationId: string) {
  const ctx = await requirePermission("library.view");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("book_reservations")
    .update({ status: "CANCELLED" })
    .eq("id", reservationId)
    .eq("college_id", ctx.profile.college_id);

  if (error) return { error: "Failed to cancel reservation" };
  revalidatePath("/library");
  revalidatePath("/my-library");
  return { success: true };
}

// ─────────────────────────────────────────
// FINES
// ─────────────────────────────────────────

export async function payFine(fineId: string) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  // Verify fine belongs to user's college
  const { data: fine } = await supabase
    .from("library_fines")
    .select("id, college_id")
    .eq("id", fineId)
    .single();

  if (!fine || fine.college_id !== collegeId) return { error: "Fine not found in your college" };

  const { error } = await supabase.from("library_fines").update({ status: "PAID" }).eq("id", fineId).eq("college_id", collegeId);
  if (error) return { error: "Failed to update fine status" };

  await logAudit(ctx.user.id, "UPDATE", "library_fines", fineId, { status: "UNPAID" }, { status: "PAID" });
  revalidatePath("/library/transactions");
  revalidatePath("/library");
  return { success: true };
}

export async function waiveFine(fineId: string) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const { data: fine } = await supabase
    .from("library_fines")
    .select("id, college_id")
    .eq("id", fineId)
    .single();

  if (!fine || fine.college_id !== collegeId) return { error: "Fine not found in your college" };

  const { error } = await supabase.from("library_fines").update({ status: "WAIVED" }).eq("id", fineId).eq("college_id", collegeId);
  if (error) return { error: "Failed to update fine status" };

  await logAudit(ctx.user.id, "UPDATE", "library_fines", fineId, { status: "UNPAID" }, { status: "WAIVED" });
  revalidatePath("/library/transactions");
  revalidatePath("/library");
  return { success: true };
}

// ─────────────────────────────────────────
// FINE RULES
// ─────────────────────────────────────────

export async function saveFineRule(formData: FormData) {
  const ctx = await requirePermission("library.manage");
  const supabase = createAdminClient();

  const fine_per_day = parseFloat(formData.get("fine_per_day") as string);
  const max_fine_raw = formData.get("max_fine") as string;
  const grace_days = parseInt(formData.get("grace_days") as string) || 0;

  if (isNaN(fine_per_day) || fine_per_day < 0) return { error: "Fine per day must be a positive number." };

  const payload = {
    college_id: ctx.profile.college_id,
    fine_per_day,
    max_fine: max_fine_raw ? parseFloat(max_fine_raw) : null,
    grace_days,
  };

  const { error } = await supabase
    .from("library_fine_rules")
    .upsert(payload, { onConflict: "college_id" });

  if (error) return { error: "Failed to save fine rule" };
  await logAudit(ctx.user.id, "UPDATE", "library_fine_rules", ctx.profile.college_id, null, payload);
  revalidatePath("/library");
  return { success: true };
}

// ─────────────────────────────────────────
// MEMBER MANAGEMENT
// ─────────────────────────────────────────

export async function registerMember(userId: string, memberType: string) {
  const ctx = await requirePermission("library.manage");
  const supabase = createAdminClient();

  const maxBooks = memberType === "FACULTY" ? 5 : memberType === "STAFF" ? 2 : 3;

  const { error } = await supabase.from("library_members").insert({
    college_id: ctx.profile.college_id,
    user_id: userId,
    member_type: memberType,
    max_books: maxBooks,
    status: "ACTIVE",
  });

  if (error) return { error: "Failed to register member" };
  await logAudit(ctx.user.id, "CREATE", "library_members", userId, null, { memberType, maxBooks });
  revalidatePath("/library/members");
  revalidatePath("/library");
  return { success: true };
}

export async function deactivateMember(memberId: string) {
  const ctx = await requirePermission("library.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  // Verify member belongs to user's college
  const { data: member } = await supabase
    .from("library_members")
    .select("id, college_id")
    .eq("id", memberId)
    .single();

  if (!member || member.college_id !== collegeId) return { error: "Member not found in your college" };

  const { count } = await supabase
    .from("library_transactions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "ISSUED");

  if ((count || 0) > 0) {
    return { error: "Cannot deactivate a member with currently issued books. Please return all books first." };
  }

  const { error } = await supabase
    .from("library_members")
    .update({ status: "INACTIVE" })
    .eq("id", memberId)
    .eq("college_id", collegeId);

  if (error) return { error: "Failed to deactivate member" };
  await logAudit(ctx.user.id, "UPDATE", "library_members", memberId, { status: "ACTIVE" }, { status: "INACTIVE" });
  revalidatePath("/library/members");
  revalidatePath("/library");
  return { success: true };
}
