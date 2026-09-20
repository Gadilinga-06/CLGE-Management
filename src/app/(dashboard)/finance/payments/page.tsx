import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaymentsClient } from "./client";

export default async function PaymentsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isFinance = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"].includes(r));
  if (!isFinance) redirect("/unauthorized");

  const supabase = await createClient();

  // Recent payments with full context
  const { data: recentPayments } = await supabase
    .from("payments")
    .select(`
      id, amount, payment_method, reference_number, payment_date, status, created_at,
      students (admission_number, profiles(first_name, last_name)),
      student_fees (
        amount_due, paid_amount,
        fee_structures (category)
      ),
      receipts (receipt_number, issued_at)
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Collection</h2>
        <p className="text-muted-foreground">Record student payments and issue receipts.</p>
      </div>
      <PaymentsClient
        recentPayments={recentPayments || []}
        collegeId={ctx.profile.college_id}
      />
    </div>
  );
}
