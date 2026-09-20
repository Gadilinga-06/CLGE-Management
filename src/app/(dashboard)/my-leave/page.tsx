import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyLeaveClient } from "./client";

export default async function MyLeavePage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.roles.includes("STUDENT") && !ctx.roles.includes("FACULTY")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  let studentId: string | undefined;
  let facultyId: string | undefined;

  if (ctx.roles.includes("STUDENT")) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    studentId = student?.id;
  }

  if (ctx.roles.includes("FACULTY")) {
    const { data: faculty } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    facultyId = faculty?.id;
  }

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      id, requester_id, start_date, end_date, reason, status,
      rejection_reason, reviewed_at, approved_by, created_at,
      profiles!leave_requests_requester_id_fkey(first_name, last_name, email)
    `)
    .eq("requester_id", ctx.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Leave Requests</h2>
          <p className="text-muted-foreground">View and manage your leave requests.</p>
        </div>
      </div>
      <MyLeaveClient leaveRequests={leaveRequests || []} />
    </div>
  );
}
