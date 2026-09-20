/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LibraryDashboardClient } from "./client";

export default async function LibraryPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();
  const isLibrarian = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"].includes(r));

  // Get college-scoped book IDs first
  const { data: collegeBooks } = await supabase
    .from("books")
    .select("id")
    .eq("college_id", ctx.profile.college_id);

  const bookIds = (collegeBooks || []).map(b => b.id);

  const [
    { count: totalBooks },
    { count: totalCopies },
    { data: availableData },
    { data: issuedData },
    { count: activeMembers },
    { data: overdueTx },
    { data: unpaidFines },
    { data: fineRule },
  ] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
    bookIds.length > 0
      ? supabase.from("book_copies").select("id", { count: "exact", head: true }).in("book_id", bookIds)
      : Promise.resolve({ count: 0 } as any),
    bookIds.length > 0
      ? supabase.from("book_copies").select("id").in("book_id", bookIds).eq("status", "AVAILABLE")
      : Promise.resolve({ data: [] }),
    bookIds.length > 0
      ? supabase.from("book_copies").select("id").in("book_id", bookIds).eq("status", "ISSUED")
      : Promise.resolve({ data: [] }),
    supabase.from("library_members").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id).eq("status", "ACTIVE"),
    supabase.from("library_transactions").select("id").eq("college_id", ctx.profile.college_id).eq("status", "OVERDUE"),
    supabase.from("library_fines").select("amount").eq("college_id", ctx.profile.college_id).eq("status", "UNPAID"),
    supabase.from("library_fine_rules").select("*").eq("college_id", ctx.profile.college_id).maybeSingle(),
  ]);

  const outstandingFines = (unpaidFines || []).reduce((s: number, f: any) => s + f.amount, 0);

  const { data: recentTransactions } = await supabase
    .from("library_transactions")
    .select(`
      id, issue_date, due_date, return_date, status, renewal_count,
      library_members(id, user_id, profiles(first_name, last_name)),
      book_copies(accession_number, books(title, author, isbn))
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Library Management</h2>
        <p className="text-muted-foreground">Manage books, members, and circulation.</p>
      </div>
      <LibraryDashboardClient
        stats={{
          totalBooks: totalBooks || 0,
          totalCopies: totalCopies || 0,
          availableCopies: availableData?.length || 0,
          issuedCopies: issuedData?.length || 0,
          activeMembers: activeMembers || 0,
          overdueCount: overdueTx?.length || 0,
          outstandingFines,
        }}
        recentTransactions={recentTransactions || []}
        fineRule={fineRule}
        isLibrarian={isLibrarian}
        collegeId={ctx.profile.college_id}
      />
    </div>
  );
}
