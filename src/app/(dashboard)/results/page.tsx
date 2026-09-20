import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResultsAdminClient, ResultsStudentClient } from "./client";

export default async function ResultsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();
  const isStudent = context.roles.includes("STUDENT");

  if (isStudent) {
    // STUDENT VIEW: Fetch their published marks and grading rules to calculate SGPA locally
    const [{ data: gradingRules }, { data: marks }] = await Promise.all([
      supabase.from("grading_rules").select("*").eq("college_id", context.profile.college_id).order("grade_point", { ascending: false }),
      supabase.from("exam_marks").select(`
        id, marks_obtained, status,
        exams (id, name, type, academic_years(year_range), semesters(semester_number)),
        exam_subjects (max_marks, min_pass_marks, subjects(name, subject_code, credits))
      `)
      .eq("student_id", context.user.id)
      .eq("status", "PUBLISHED")
    ]);

    return (
      <div className="space-y-6 max-w-5xl mx-auto print:max-w-full print:m-0 print:p-0">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Academic Results</h2>
            <p className="text-muted-foreground">View your transcripts and published grades.</p>
          </div>
        </div>
        <ResultsStudentClient marks={marks || []} gradingRules={gradingRules || []} profile={context.profile} />
      </div>
    );
  } else {
    // ADMIN / FACULTY VIEW: Manage Result Publishing
    if (!context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN") && !context.roles.includes("HOD")) {
      redirect("/unauthorized"); // Only admins can publish
    }

    // Fetch subjects that have SUBMITTED or PUBLISHED marks to review
    const { data: subjectSummaries } = await supabase
      .from("exam_subjects")
      .select(`
        id, exam_id, subject_id,
        exams (name, type),
        subjects (name, subject_code),
        exam_marks (status)
      `)
      .eq("exams.college_id", context.profile.college_id)
      .neq("exams.status", "COMPLETED");

    // Process the data to show counts of submitted vs published
    const processed = (subjectSummaries || []).map(es => {
      const marks = Array.isArray(es.exam_marks) ? es.exam_marks : [];
      const total = marks.length;
      const submitted = marks.filter(m => m.status === 'SUBMITTED' || m.status === 'APPROVED').length;
      const published = marks.filter(m => m.status === 'PUBLISHED').length;
      return {
        ...es,
        total,
        submitted,
        published,
        readyToPublish: submitted > 0 && published === 0
      };
    }).filter(es => es.total > 0); // Only show subjects that have some marks entered

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Results Publishing</h2>
            <p className="text-muted-foreground">Review submitted marks and publish official results.</p>
          </div>
        </div>
        <ResultsAdminClient summaries={processed} />
      </div>
    );
  }
}
