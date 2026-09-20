import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExamsClient } from "./client";

export default async function ExamsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN") && !context.roles.includes("HOD")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const [
    { data: exams },
    { data: subjects },
    { data: academicYears },
    { data: semesters }
  ] = await Promise.all([
    supabase.from("exams").select(`
      id, name, type, status,
      academic_years (year_range),
      semesters (semester_number),
      exam_subjects (id, max_marks, subjects(name))
    `).eq("college_id", context.profile.college_id).order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name, subject_code").eq("college_id", context.profile.college_id),
    supabase.from("academic_years").select("id, year_range").eq("college_id", context.profile.college_id),
    supabase.from("semesters").select("id, semester_number").eq("college_id", context.profile.college_id)
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exams Configuration</h2>
          <p className="text-muted-foreground">Manage exam definitions and subject max marks.</p>
        </div>
      </div>
      
      <ExamsClient 
        exams={exams || []} 
        subjects={subjects || []}
        academicYears={academicYears || []}
        semesters={semesters || []}
      />
    </div>
  );
}
