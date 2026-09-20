import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaveClient } from "./client";

export default async function LeavePage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  const isApprover =
    ctx.roles.includes("COLLEGE_ADMIN") ||
    ctx.roles.includes("HOD") ||
    ctx.roles.includes("PRINCIPAL");

  let studentId: string | undefined;
  if (ctx.roles.includes("STUDENT")) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    studentId = student?.id;
  }

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      id, requester_id, start_date, end_date, reason, status,
      rejection_reason, reviewed_at, approved_by, college_id, created_at,
      profiles!leave_requests_requester_id_fkey(first_name, last_name, email)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Manage and review leave requests.</p>
        </div>
      </div>
      <LeaveClient
        leaveRequests={leaveRequests || []}
        isApprover={isApprover}
        studentId={studentId}
      />
    </div>
  );
}
