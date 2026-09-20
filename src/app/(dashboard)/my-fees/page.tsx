import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyFeesClient } from "./client";

export default async function MyFeesPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.roles.includes("STUDENT")) redirect("/unauthorized");

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, admission_number, profiles(first_name, last_name, email)")
    .eq("user_id", ctx.user.id)
    .single();

  if (!student) redirect("/unauthorized");

  const [{ data: fees }, { data: payments }, { data: refunds }] = await Promise.all([
    supabase
      .from("student_fees")
      .select(`
        id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status, remarks,
        fee_structures (category, amount, due_date, academic_years(name), late_fee_per_day, grace_days)
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("payments")
      .select(`
        id, amount, payment_method, payment_date, reference_number, status,
        receipts (receipt_number, issued_at),
        student_fees (fee_structures(category))
      `)
      .eq("student_id", student.id)
      .order("payment_date", { ascending: false }),

    supabase
      .from("refunds")
      .select(`
        id, amount, reason, refund_method, reference_number, status, created_at,
        payments!inner (id, student_id)
      `)
      .eq("payments.student_id", student.id)
      .eq("status", "COMPLETED")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-full print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Fees & Payments</h2>
          <p className="text-muted-foreground">View your fee status and download receipts.</p>
        </div>
      </div>
      <MyFeesClient fees={fees || []} payments={payments || []} refunds={refunds || []} student={student} />
    </div>
  );
}
