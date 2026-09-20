import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssignmentsClient } from "./client";

export default async function AssignmentsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (
    !context.roles.includes("FACULTY") &&
    !context.roles.includes("SUPER_ADMIN") &&
    !context.roles.includes("COLLEGE_ADMIN") &&
    !context.roles.includes("HOD")
  ) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: faculty } = await supabase
    .from("faculty")
    .select("id, department_id")
    .eq("user_id", context.user.id)
    .single();

  const [assignmentsRes, subjectsRes, sectionsRes, facultyAssignmentsRes] = await Promise.all([
    supabase
      .from("assignments")
      .select(`
        id, title, description, deadline, max_marks, status, allow_late_submission, created_at,
        subjects (id, name, subject_code),
        sections (id, name),
        faculty (id, user_id)
      `)
      .eq("faculty_id", faculty?.id || "")
      .order("created_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name, subject_code"),
    supabase
      .from("sections")
      .select("id, name, semester_id"),
    supabase
      .from("faculty_assignments")
      .select(`
        id,
        subjects (id, name, subject_code),
        sections (id, name)
      `)
      .eq("faculty_id", faculty?.id || ""),
  ]);

  const assignments = assignmentsRes.data || [];
  const subjects = subjectsRes.data || [];
  const sections = sectionsRes.data || [];
  const facultyAssignmentsList = facultyAssignmentsRes.data || [];

  const assignmentIds = assignments.map((a: { id: string }) => a.id);

  const submissionCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let submissions: any[] = [];

  if (assignmentIds.length > 0) {
    const [subCountRes, subRes] = await Promise.all([
      supabase
        .from("assignment_submissions")
        .select("assignment_id")
        .in("assignment_id", assignmentIds),
      supabase
        .from("assignment_submissions")
        .select(`
          id, assignment_id, student_id, submission_url, submitted_at, marks_obtained, feedback,
          students (id, user_id, admission_number, profiles(first_name, last_name))
        `)
        .in("assignment_id", assignmentIds),
    ]);

    const subData = subCountRes.data || [];
    subData.forEach((s: { assignment_id: string }) => {
      submissionCounts[s.assignment_id] = (submissionCounts[s.assignment_id] || 0) + 1;
    });
    submissions = subRes.data || [];
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Create and manage assignments for your sections.</p>
        </div>
      </div>
      <AssignmentsClient
        assignments={assignments}
        subjects={subjects}
        sections={sections}
        facultyAssignments={facultyAssignmentsList}
        submissionCounts={submissionCounts}
        submissions={submissions}
        userId={context.user.id}
      />
    </div>
  );
}
