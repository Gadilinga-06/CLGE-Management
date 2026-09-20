/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "./client";

export default async function FinanceReportsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isFinance = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"].includes(r));
  if (!isFinance) redirect("/unauthorized");

  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [
    { data: todayPayments },
    { data: monthPayments },
    { data: outstandingFees },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(`
        id, amount, payment_method, reference_number, payment_date, status,
        students (admission_number, profiles(first_name, last_name)),
        student_fees (fee_structures(category)),
        receipts (receipt_number)
      `)
      .eq("college_id", ctx.profile.college_id)
      .eq("payment_date", today),

    supabase
      .from("payments")
      .select("id, amount, payment_date, payment_method, status")
      .eq("college_id", ctx.profile.college_id)
      .gte("payment_date", firstOfMonth),

    supabase
      .from("student_fees")
      .select(`
        id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status,
        students(admission_number, profiles(first_name, last_name)),
        fee_structures(category, academic_years(name))
      `)
      .eq("college_id", ctx.profile.college_id)
      .in("status", ["PENDING", "PARTIAL"])
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  const todayTotal = (todayPayments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const monthTotal = (monthPayments || []).reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Finance Reports</h2>
        <p className="text-muted-foreground">Daily collections, monthly summaries, outstanding fees, student ledger, and department collection.</p>
      </div>
      <ReportsClient
        todayPayments={todayPayments || []}
        monthPayments={monthPayments || []}
        outstandingFees={outstandingFees || []}
        todayTotal={todayTotal}
        monthTotal={monthTotal}
      />
    </div>
  );
}
