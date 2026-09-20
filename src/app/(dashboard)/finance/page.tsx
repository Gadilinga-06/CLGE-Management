/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, ListChecks, BarChart3, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";

export default async function FinancePage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isFinance = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"].includes(r));
  if (!isFinance) redirect("/unauthorized");

  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [
    { count: pendingCount },
    { data: todayData },
    { count: feeStructures },
    { data: monthData },
    { data: outstandingData },
  ] = await Promise.all([
    supabase.from("student_fees").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id).in("status", ["PENDING", "PARTIAL"]),
    supabase.from("payments").select("amount").eq("college_id", ctx.profile.college_id).eq("payment_date", today),
    supabase.from("fee_structures").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
    supabase.from("payments").select("amount").eq("college_id", ctx.profile.college_id).gte("payment_date", firstOfMonth),
    supabase.from("student_fees").select("amount_due, paid_amount, late_fee_amount, scholarship_amount, discount_amount").eq("college_id", ctx.profile.college_id).in("status", ["PENDING", "PARTIAL"]),
  ]);

  const todayTotal = (todayData || []).reduce((s: number, p: any) => s + p.amount, 0);
  const monthTotal = (monthData || []).reduce((s: number, p: any) => s + p.amount, 0);
  const totalOutstanding = (outstandingData || []).reduce((s: number, sf: any) => {
    const effective = (sf.amount_due || 0) + (sf.late_fee_amount || 0) - (sf.scholarship_amount || 0) - (sf.discount_amount || 0);
    return s + Math.max(0, effective - (sf.paid_amount || 0));
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Finance & Fees</h2>
        <p className="text-muted-foreground">Manage fee structures, collect payments, and view financial reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Collection</span>
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">₹{todayTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">₹{monthTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingCount || 0} pending records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fee Structures</span>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{feeStructures || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">configured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/finance/fees", icon: <IndianRupee className="w-6 h-6" />, title: "Fee Structures", desc: "Create and assign fee templates to courses and years." },
          { href: "/finance/payments", icon: <ListChecks className="w-6 h-6" />, title: "Payment Collection", desc: "Record payments, issue receipts, and process refunds." },
          { href: "/finance/reports", icon: <BarChart3 className="w-6 h-6" />, title: "Reports", desc: "Daily, monthly, outstanding, student ledger, and department reports." },
        ].map(item => (
          <Card key={item.href} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">{item.icon}</div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
              <Link href={item.href} className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium transition-colors">
                Open <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
