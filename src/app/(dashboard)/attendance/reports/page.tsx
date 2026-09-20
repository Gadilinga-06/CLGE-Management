import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AttendanceReportsClient } from "./client";

export default async function AttendanceReportsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("FACULTY") && !context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN") && !context.roles.includes("HOD")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // Fetch all active students in the college
  const { data: students } = await supabase
    .from("students")
    .select(`
      id,
      admission_number,
      profiles (first_name, last_name, avatar_url),
      departments (name),
      courses (name),
      semesters (semester_number),
      sections (name)
    `)
    .eq("status", "ACTIVE");

  // Fetch all attendance records
  const { data: records } = await supabase
    .from("attendance_records")
    .select("student_id, status, attendance_sessions(date, subject_id)")
    .eq("college_id", context.profile.college_id);

  // Process data for the report
  const reportData = (students || []).map(student => {
    const studentRecords = (records || []).filter(r => r.student_id === student.id);
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      ...student,
      total_sessions: total,
      present_sessions: present,
      percentage
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Reports</h2>
          <p className="text-muted-foreground">Monitor student attendance and identify shortages.</p>
        </div>
      </div>
      <AttendanceReportsClient data={reportData} />
    </div>
  );
}
