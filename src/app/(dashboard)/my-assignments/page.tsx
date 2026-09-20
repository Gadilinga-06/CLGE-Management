import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyAssignmentsClient } from "./client";

export default async function MyAssignmentsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("STUDENT")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, section_id, admission_number, profiles(first_name, last_name, email)")
    .eq("user_id", context.user.id)
    .single();

  if (!student) redirect("/unauthorized");

  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      id, title, description, deadline, max_marks, status, allow_late_submission, created_at,
      subjects (id, name, subject_code),
      sections (id, name)
    `)
    .eq("section_id", student.section_id)
    .in("status", ["PUBLISHED", "CLOSED"])
    .order("deadline", { ascending: true });

  const assignmentIds = (assignments || []).map((a: { id: string }) => a.id);

  let mySubmissions: Array<{
    id: string;
    assignment_id: string;
    submission_url: string;
    submitted_at: string;
    marks_obtained: number | null;
    feedback: string | null;
  }> = [];
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, submission_url, submitted_at, marks_obtained, feedback")
      .eq("student_id", student.id)
      .in("assignment_id", assignmentIds);

    mySubmissions = data || [];
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Assignments</h2>
          <p className="text-muted-foreground">View and submit your assignments.</p>
        </div>
      </div>
      <MyAssignmentsClient
        assignments={assignments || []}
        mySubmissions={mySubmissions}
        studentId={student.id}
      />
    </div>
  );
}
