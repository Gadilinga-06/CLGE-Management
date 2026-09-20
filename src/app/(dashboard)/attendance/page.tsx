import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AttendanceClient } from "./client";

export default async function AttendancePage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  // Allow faculty and admins
  if (!context.roles.includes("FACULTY") && !context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // 1. Fetch Faculty Assignments (to know which subjects/sections they teach)
  // If they are an admin, they might not have direct assignments, they might need to view all.
  // But for this phase, we'll focus on the Faculty Workflow (or Admins acting as faculty).
  const { data: assignments } = await supabase
    .from("faculty_assignments")
    .select(`
      id,
      subjects (id, name, subject_code),
      sections (id, name),
      semesters (id, semester_number)
    `)
    .eq("faculty_id", context.user.id)
    .eq("college_id", context.profile.college_id);

  // 2. Fetch Recent Sessions for this faculty
  const { data: recentSessions } = await supabase
    .from("attendance_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      subjects (name),
      sections (name)
    `)
    .eq("faculty_id", context.user.id)
    .eq("college_id", context.profile.college_id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">Record and manage student attendance.</p>
        </div>
      </div>
      <AttendanceClient 
        assignments={assignments || []} 
        recentSessions={recentSessions || []}
        userId={context.user.id}
      />
    </div>
  );
}
