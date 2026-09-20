import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarksClient } from "./client";

export default async function MarksEntryPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("FACULTY") && !context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // If user is FACULTY, filter by their assignments. Otherwise show all (for Admins).
  let subjectIds: string[] = [];
  const sectionsMap: Record<string, string> = {}; // map subject_id -> section_id for faculty

  if (!context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    const { data: assignments } = await supabase
      .from("faculty_assignments")
      .select("subject_id, section_id")
      .eq("faculty_id", context.user.id)
      .eq("college_id", context.profile.college_id);
    
    if (assignments) {
      subjectIds = assignments.map(a => a.subject_id);
      assignments.forEach(a => {
        sectionsMap[a.subject_id] = a.section_id;
      });
    }
  }

  // Fetch exam subjects
  let query = supabase
    .from("exam_subjects")
    .select(`
      id, max_marks, exam_id, subject_id,
      exams (name, status),
      subjects (name, subject_code)
    `)
    .eq("exams.college_id", context.profile.college_id)
    .neq("exams.status", "COMPLETED");

  if (subjectIds.length > 0) {
    query = query.in("subject_id", subjectIds);
  }

  const { data: examSubjects } = await query;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marks Entry</h2>
          <p className="text-muted-foreground">Enter and submit student marks for authorized subjects.</p>
        </div>
      </div>
      <MarksClient 
        examSubjects={examSubjects || []} 
        sectionsMap={sectionsMap}
        userId={context.user.id}
      />
    </div>
  );
}
