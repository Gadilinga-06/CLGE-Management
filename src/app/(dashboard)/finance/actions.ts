/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// FEE STRUCTURES
// ──────────────────────────────────────────────

export async function createFeeStructure(formData: FormData) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  const category = formData.get("category") as string;
  const course_id = formData.get("course_id") as string;
  const academic_year_id = formData.get("academic_year_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const due_date = (formData.get("due_date") as string) || null;
  const semester_id = (formData.get("semester_id") as string) || null;
  const student_category = (formData.get("student_category") as string) || null;
  const late_fee_per_day = parseFloat((formData.get("late_fee_per_day") as string) || "0");
  const late_fee_max = parseFloat((formData.get("late_fee_max") as string) || "0");
  const grace_days = parseInt((formData.get("grace_days") as string) || "0", 10);

  if (!category || !course_id || !academic_year_id || isNaN(amount) || amount <= 0) {
    return { error: "All required fields must be filled with valid values." };
  }

  const payload = {
    college_id: ctx.profile.college_id,
    academic_year_id,
    course_id,
    category,
    amount,
    due_date: due_date || null,
    semester_id: semester_id || null,
    student_category: student_category || null,
    late_fee_per_day,
    late_fee_max,
    grace_days,
  };

  const { data, error } = await supabase.from("fee_structures").insert(payload).select().single();
  if (error) return { error: error.message };

  await logAudit(ctx.user.id, "CREATE", "fee_structures", data.id, null, payload);
  revalidatePath("/finance/fees");
  return { success: true };
}

export async function updateFeeStructure(id: string, formData: FormData) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  const category = formData.get("category") as string;
  const course_id = formData.get("course_id") as string;
  const academic_year_id = formData.get("academic_year_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const due_date = (formData.get("due_date") as string) || null;
  const semester_id = (formData.get("semester_id") as string) || null;
  const student_category = (formData.get("student_category") as string) || null;
  const late_fee_per_day = parseFloat((formData.get("late_fee_per_day") as string) || "0");
  const late_fee_max = parseFloat((formData.get("late_fee_max") as string) || "0");
  const grace_days = parseInt((formData.get("grace_days") as string) || "0", 10);

  if (!category || !course_id || !academic_year_id || isNaN(amount) || amount <= 0) {
    return { error: "All required fields must be filled with valid values." };
  }

  const { error } = await supabase
    .from("fee_structures")
    .update({
      category,
      course_id,
      academic_year_id,
      amount,
      due_date: due_date || null,
      semester_id: semester_id || null,
      student_category: student_category || null,
      late_fee_per_day,
      late_fee_max,
      grace_days,
    })
    .eq("id", id)
    .eq("college_id", ctx.profile.college_id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "fee_structures", id, null, { category, amount });
  revalidatePath("/finance/fees");
  return { success: true };
}

export async function deleteFeeStructure(id: string) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("fee_structures")
    .delete()
    .eq("id", id)
    .eq("college_id", ctx.profile.college_id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "fee_structures", id, null, null);
  revalidatePath("/finance/fees");
  return { success: true };
}

// ──────────────────────────────────────────────
// ASSIGN FEES TO STUDENTS
// ──────────────────────────────────────────────

export async function assignFeesToStudents(feeStructureId: string) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  const { data: fs, error: fsErr } = await supabase
    .from("fee_structures")
    .select("course_id, academic_year_id, semester_id, student_category, amount, college_id, due_date")
    .eq("id", feeStructureId)
    .single();

  if (fsErr || !fs) return { error: "Fee structure not found." };

  const { data: students } = await supabase
    .from("students")
    .select("id, section_id, sections(semester_id, semesters(course_id))")
    .eq("status", "ACTIVE")
    .eq("academic_year_id", fs.academic_year_id);

  if (!students) return { error: "No students found." };

  const eligible = students.filter((s: any) => {
    const courseId = s.sections?.semesters?.course_id;
    return courseId === fs.course_id;
  });

  if (eligible.length === 0) return { error: "No eligible students found for this course." };

  const inserts = eligible.map((s: any) => ({
    college_id: fs.college_id,
    student_id: s.id,
    fee_structure_id: feeStructureId,
    amount_due: fs.amount,
    paid_amount: 0,
    scholarship_amount: 0,
    discount_amount: 0,
    late_fee_amount: 0,
    status: "PENDING",
  }));

  const { error: insertErr } = await supabase
    .from("student_fees")
    .upsert(inserts, { onConflict: "student_id,fee_structure_id" });

  if (insertErr) return { error: insertErr.message };

  await logAudit(ctx.user.id, "CREATE", "student_fees", feeStructureId, null, { count: inserts.length });
  revalidatePath("/finance/fees");
  return { success: true, count: inserts.length };
}

// ──────────────────────────────────────────────
// LATE FEE CALCULATION
// ──────────────────────────────────────────────

export async function calculateLateFees() {
  const ctx = await requirePermission("fees.collect");
  const supabase = createAdminClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: pendingFees, error } = await supabase
    .from("student_fees")
    .select(`
      id, amount_due, late_fee_amount, due_date, fee_structures(late_fee_per_day, late_fee_max, grace_days)
    `)
    .eq("college_id", ctx.profile.college_id)
    .in("status", ["PENDING", "PARTIAL"]);

  if (error || !pendingFees) return { error: "Failed to fetch pending fees." };

  let updated = 0;
  for (const sf of pendingFees) {
    const fs = sf.fee_structures as any;
    if (!fs?.late_fee_per_day || !sf.due_date) continue;

    const dueDate = new Date(sf.due_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= fs.grace_days) continue;

    const lateDays = diffDays - fs.grace_days;
    let newLateFee = lateDays * fs.late_fee_per_day;
    if (fs.late_fee_max > 0) {
      newLateFee = Math.min(newLateFee, fs.late_fee_max);
    }

    if (newLateFee !== sf.late_fee_amount) {
      await supabase
        .from("student_fees")
        .update({ late_fee_amount: newLateFee })
        .eq("id", sf.id);
      updated++;
    }
  }

  if (updated > 0) {
    await logAudit(ctx.user.id, "UPDATE", "student_fees", "late_fees_batch", null, { updated_count: updated });
    revalidatePath("/finance/payments");
    revalidatePath("/finance/reports");
    revalidatePath("/my-fees");
  }

  return { success: true, updated };
}

// ──────────────────────────────────────────────
// RECORD PAYMENT
// ──────────────────────────────────────────────

export async function recordPayment(payload: {
  student_fee_id: string;
  student_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  gateway_metadata?: any;
}) {
  const ctx = await requirePermission("fees.collect");
  const supabase = createAdminClient();

  const { data: sf, error: sfErr } = await supabase
    .from("student_fees")
    .select("id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status, college_id, due_date")
    .eq("id", payload.student_fee_id)
    .single();

  if (sfErr || !sf) return { error: "Student fee record not found." };
  if (sf.status === "PAID") return { error: "This fee has already been fully paid." };

  // Auto-calculate late fees before checking outstanding
  if (sf.due_date) {
    const { data: fsConfig } = await supabase
      .from("fee_structures")
      .select("late_fee_per_day, late_fee_max, grace_days")
      .eq("id", (await supabase.from("student_fees").select("fee_structure_id").eq("id", payload.student_fee_id).single()).data?.fee_structure_id)
      .single();

    if (fsConfig && fsConfig.late_fee_per_day > 0) {
      const today = new Date().toISOString().split("T")[0];
      const dueDate = new Date(sf.due_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > (fsConfig.grace_days || 0)) {
        const lateDays = diffDays - (fsConfig.grace_days || 0);
        let newLateFee = lateDays * fsConfig.late_fee_per_day;
        if (fsConfig.late_fee_max > 0) {
          newLateFee = Math.min(newLateFee, fsConfig.late_fee_max);
        }
        if (newLateFee !== sf.late_fee_amount) {
          await supabase
            .from("student_fees")
            .update({ late_fee_amount: newLateFee })
            .eq("id", payload.student_fee_id);
          sf.late_fee_amount = newLateFee;
        }
      }
    }
  }

  const effective = sf.amount_due + sf.late_fee_amount - sf.scholarship_amount - sf.discount_amount;
  const alreadyPaid = sf.paid_amount || 0;
  const outstanding = effective - alreadyPaid;

  if (payload.amount <= 0) return { error: "Payment amount must be greater than zero." };
  if (payload.amount > outstanding + 0.01) return { error: `Amount exceeds outstanding balance of ₹${outstanding.toFixed(2)}.` };

  const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      college_id: sf.college_id,
      student_fee_id: payload.student_fee_id,
      student_id: payload.student_id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      reference_number: payload.reference_number || null,
      gateway_metadata: payload.gateway_metadata || null,
      status: "COMPLETED",
    })
    .select()
    .single();

  if (payErr) return { error: payErr.message };

  await supabase.from("receipts").insert({
    payment_id: payment.id,
    receipt_number: receiptNumber,
    issued_by: ctx.user.id,
  });

  const newPaid = alreadyPaid + payload.amount;
  const newStatus = newPaid >= outstanding - 0.01 ? "PAID" : "PARTIAL";

  await supabase
    .from("student_fees")
    .update({ paid_amount: newPaid, status: newStatus })
    .eq("id", payload.student_fee_id);

  await logAudit(ctx.user.id, "CREATE", "payments", payment.id, null, payload);
  revalidatePath("/finance/payments");
  revalidatePath("/finance/reports");
  revalidatePath("/my-fees");
  return { success: true, receiptNumber };
}

// ──────────────────────────────────────────────
// APPLY SCHOLARSHIP / DISCOUNT
// ──────────────────────────────────────────────

export async function applyAdjustment(payload: {
  student_fee_id: string;
  type: "scholarship" | "discount";
  amount: number;
  reason?: string;
}) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  if (payload.amount <= 0) return { error: "Adjustment amount must be greater than zero." };

  // Fetch current values to validate
  const { data: sf } = await supabase
    .from("student_fees")
    .select("amount_due, late_fee_amount, scholarship_amount, discount_amount, paid_amount")
    .eq("id", payload.student_fee_id)
    .single();

  if (!sf) return { error: "Student fee record not found." };

  const field = payload.type === "scholarship" ? "scholarship_amount" : "discount_amount";
  const updatedAmount = payload.type === "scholarship" ? payload.amount : payload.amount;

  // Validate that adjustments don't make total negative
  const effective = sf.amount_due + sf.late_fee_amount - updatedAmount - (payload.type === "discount" ? sf.discount_amount : 0) - (payload.type === "scholarship" ? sf.scholarship_amount : 0);
  if (effective < 0) {
    return { error: "Adjustment amount exceeds the fee amount." };
  }

  const { error } = await supabase
    .from("student_fees")
    .update({ [field]: payload.amount, remarks: payload.reason || null })
    .eq("id", payload.student_fee_id)
    .eq("college_id", ctx.profile.college_id);

  if (error) return { error: error.message };

  // Auto-recalculate status
  const newEffective = sf.amount_due + sf.late_fee_amount - (payload.type === "scholarship" ? payload.amount : sf.scholarship_amount) - (payload.type === "discount" ? payload.amount : sf.discount_amount);
  const newStatus = sf.paid_amount >= newEffective - 0.01 ? "PAID" : sf.paid_amount > 0 ? "PARTIAL" : "PENDING";
  await supabase.from("student_fees").update({ status: newStatus }).eq("id", payload.student_fee_id);

  await logAudit(ctx.user.id, "UPDATE", "student_fees", payload.student_fee_id, null, { adjustment: payload });
  revalidatePath("/finance/payments");
  revalidatePath("/finance/reports");
  revalidatePath("/my-fees");
  return { success: true };
}

// ──────────────────────────────────────────────
// PROCESS REFUND
// ──────────────────────────────────────────────

export async function processRefund(payload: {
  payment_id: string;
  amount: number;
  reason: string;
  refund_method?: string;
  reference_number?: string;
}) {
  const ctx = await requirePermission("fees.collect");
  const supabase = createAdminClient();

  if (payload.amount <= 0) return { error: "Refund amount must be greater than zero." };

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("id, amount, student_fee_id, student_id, college_id, status")
    .eq("id", payload.payment_id)
    .single();

  if (payErr || !payment) return { error: "Payment not found." };
  if (payment.status === "REFUNDED") return { error: "This payment has already been fully refunded." };

  // Check total existing refunds for this payment
  const { data: existingRefunds } = await supabase
    .from("refunds")
    .select("amount")
    .eq("payment_id", payload.payment_id)
    .eq("status", "COMPLETED");

  const totalRefunded = (existingRefunds || []).reduce((s: number, r: any) => s + r.amount, 0);
  const maxRefundable = payment.amount - totalRefunded;

  if (payload.amount > maxRefundable + 0.01) {
    return { error: `Refund amount exceeds refundable balance of ₹${maxRefundable.toFixed(2)}.` };
  }

  const { data: refund, error: refErr } = await supabase
    .from("refunds")
    .insert({
      payment_id: payload.payment_id,
      amount: payload.amount,
      reason: payload.reason,
      processed_by: ctx.user.id,
      college_id: payment.college_id,
      refund_method: payload.refund_method || "ORIGINAL",
      reference_number: payload.reference_number || null,
      status: "COMPLETED",
    })
    .select()
    .single();

  if (refErr) return { error: refErr.message };

  // Update student_fees paid_amount
  if (payment.student_fee_id) {
    const { data: sf } = await supabase
      .from("student_fees")
      .select("paid_amount, amount_due, late_fee_amount, scholarship_amount, discount_amount")
      .eq("id", payment.student_fee_id)
      .single();

    if (sf) {
      const newPaid = Math.max(0, sf.paid_amount - payload.amount);
      const effective = sf.amount_due + sf.late_fee_amount - sf.scholarship_amount - sf.discount_amount;
      const newStatus = newPaid >= effective - 0.01 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";
      await supabase
        .from("student_fees")
        .update({ paid_amount: newPaid, status: newStatus })
        .eq("id", payment.student_fee_id);
    }
  }

  // If fully refunded, update payment status
  if (totalRefunded + payload.amount >= payment.amount - 0.01) {
    await supabase
      .from("payments")
      .update({ status: "REFUNDED" })
      .eq("id", payload.payment_id);
  }

  await logAudit(ctx.user.id, "CREATE", "refunds", refund.id, null, payload);
  revalidatePath("/finance/payments");
  revalidatePath("/finance/reports");
  revalidatePath("/my-fees");
  return { success: true };
}

// ──────────────────────────────────────────────
// REPORTS: STUDENT LEDGER
// ──────────────────────────────────────────────

export async function getStudentLedger(admissionNumber: string) {
  const ctx = await requirePermission("fees.view");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, admission_number, profiles(first_name, last_name, email)")
    .eq("admission_number", admissionNumber.trim())
    .single();

  if (!student) return { error: "Student not found." };

  const [{ data: fees }, { data: payments }, { data: refunds }] = await Promise.all([
    supabase
      .from("student_fees")
      .select(`
        id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status, remarks, created_at,
        fee_structures (category, amount, due_date, academic_years(name))
      `)
      .eq("student_id", student.id)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: true }),

    supabase
      .from("payments")
      .select(`
        id, amount, payment_method, payment_date, reference_number, status, created_at,
        receipts (receipt_number)
      `)
      .eq("student_id", student.id)
      .eq("college_id", ctx.profile.college_id)
      .order("payment_date", { ascending: true }),

    supabase
      .from("refunds")
      .select(`
        id, amount, reason, refund_method, reference_number, status, created_at,
        payments!inner (id, student_id)
      `)
      .eq("payments.student_id", student.id)
      .eq("college_id", ctx.profile.college_id)
      .eq("status", "COMPLETED")
      .order("created_at", { ascending: true }),
  ]);

  return {
    success: true,
    student,
    fees: fees || [],
    payments: payments || [],
    refunds: refunds || [],
  };
}

// ──────────────────────────────────────────────
// REPORTS: DEPARTMENT COLLECTION
// ──────────────────────────────────────────────

export async function getDepartmentCollection(filters: { from_date?: string; to_date?: string }) {
  const ctx = await requirePermission("fees.view");
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(`
      amount, payment_date, status,
      students (
        department_id, departments (name)
      )
    `)
    .eq("college_id", ctx.profile.college_id)
    .eq("status", "COMPLETED");

  if (filters.from_date) query = query.gte("payment_date", filters.from_date);
  if (filters.to_date) query = query.lte("payment_date", filters.to_date);

  const { data: payments, error } = await query;

  if (error) return { error: error.message };

  // Group by department
  const byDept: Record<string, { name: string; total: number; count: number }> = {};
  (payments || []).forEach((p: any) => {
    const deptName = p.students?.departments?.name || "Unknown";
    const deptId = p.students?.department_id || "unknown";
    if (!byDept[deptId]) byDept[deptId] = { name: deptName, total: 0, count: 0 };
    byDept[deptId].total += p.amount;
    byDept[deptId].count += 1;
  });

  return {
    success: true,
    departments: Object.values(byDept).sort((a, b) => b.total - a.total),
    totalCollected: (payments || []).reduce((s: number, p: any) => s + p.amount, 0),
  };
}

// ──────────────────────────────────────────────
// HOSTEL FEE INTEGRATION
// ──────────────────────────────────────────────

export async function generateHostelFees(academicYearId: string) {
  const ctx = await requirePermission("fees.create");
  const supabase = createAdminClient();

  // Get active allocations with room rent info
  const { data: allocations, error: allocErr } = await supabase
    .from("hostel_allocations")
    .select(`
      id, student_id, college_id, academic_year_id,
      hostel_beds!inner(
        hostel_rooms!inner(id, monthly_rent, block_id, hostel_blocks(hostel_id, hostels(name)))
      )
    `)
    .eq("status", "ALLOCATED")
    .eq("academic_year_id", academicYearId)
    .eq("college_id", ctx.profile.college_id);

  if (allocErr) return { error: allocErr.message };
  if (!allocations || allocations.length === 0) return { error: "No active hostel allocations found." };

  // Group by rent amount to create/update fee structures
  const rentGroups: Record<number, { amount: number; allocs: any[] }> = {};
  (allocations as any[]).forEach(a => {
    const rent = a.hostel_beds?.hostel_rooms?.monthly_rent || 0;
    if (rent > 0) {
      if (!rentGroups[rent]) rentGroups[rent] = { amount: rent, allocs: [] };
      rentGroups[rent].allocs.push(a);
    }
  });

  if (Object.keys(rentGroups).length === 0) return { error: "No hostel rooms with rent configured." };

  let totalAssigned = 0;

  for (const [, group] of Object.entries(rentGroups)) {
    // Find or create fee structure for this rent amount
    const { data: existing } = await supabase
      .from("fee_structures")
      .select("id")
      .eq("college_id", ctx.profile.college_id)
      .eq("academic_year_id", academicYearId)
      .eq("category", "HOSTEL")
      .eq("amount", group.amount)
      .maybeSingle();

    let feeStructureId = existing?.id;

    if (!feeStructureId) {
      // Get any course_id from students in this college (fee_structures requires course_id)
      const { data: anyCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("department_id", (await supabase.from("departments").select("id").eq("college_id", ctx.profile.college_id).limit(1).single()).data?.id || "")
        .limit(1)
        .single();

      if (!anyCourse) continue;

      const { data: fs, error: fsErr } = await supabase
        .from("fee_structures")
        .insert({
          college_id: ctx.profile.college_id,
          academic_year_id: academicYearId,
          course_id: anyCourse.id,
          category: "HOSTEL",
          amount: group.amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select("id")
        .single();

      if (fsErr || !fs) continue;
      feeStructureId = fs.id;
    }

    // Assign fees to allocated students
    const inserts = group.allocs.map(a => ({
      college_id: ctx.profile.college_id,
      student_id: a.student_id,
      fee_structure_id: feeStructureId!,
      amount_due: group.amount,
      paid_amount: 0,
      scholarship_amount: 0,
      discount_amount: 0,
      late_fee_amount: 0,
      status: "PENDING",
      remarks: `Hostel allocation: ${a.id}`,
      hostel_allocation_id: a.id,
    }));

    const { error: insertErr } = await supabase
      .from("student_fees")
      .upsert(inserts, { onConflict: "student_id,fee_structure_id" });

    if (!insertErr) totalAssigned += inserts.length;
  }

  await logAudit(ctx.user.id, "CREATE", "student_fees", "hostel", null, { count: totalAssigned, academic_year_id: academicYearId });
  revalidatePath("/finance/fees");
  revalidatePath("/hostel");
  return { success: true, count: totalAssigned };
}

export async function reconcileHostelFees() {
  const ctx = await requirePermission("fees.collect");
  const supabase = createAdminClient();

  // Find student_fees linked to hostel allocations that are now VACATED
  const { data: orphaned, error } = await supabase
    .from("student_fees")
    .select(`
      id, hostel_allocation_id, status, amount_due, paid_amount,
      hostel_allocations!inner(id, status)
    `)
    .eq("college_id", ctx.profile.college_id)
    .not("hostel_allocation_id", "is", null);

  if (error) return { error: error.message };

  const toAdjust = (orphaned || []).filter((f: any) => f.hostel_allocations?.status === "VACATED" && f.status !== "REFUNDED");

  if (toAdjust.length === 0) return { success: true, adjusted: 0, message: "All hostel fees are reconciled." };

  let adjusted = 0;
  for (const fee of toAdjust) {
    // If fully paid, mark for refund review; if unpaid, mark CANCELLED
    if ((fee as any).paid_amount > 0) {
      await supabase
        .from("student_fees")
        .update({ status: "REFUND_DUE", remarks: "Hostel allocation vacated — refund review needed" })
        .eq("id", (fee as any).id);
    } else {
      await supabase
        .from("student_fees")
        .update({ status: "CANCELLED", remarks: "Hostel allocation vacated — fee cancelled" })
        .eq("id", (fee as any).id);
    }
    adjusted++;
  }

  await logAudit(ctx.user.id, "UPDATE", "student_fees", "hostel_reconcile", null, { adjusted });
  revalidatePath("/finance/fees");
  revalidatePath("/finance/payments");
  return { success: true, adjusted };
}
