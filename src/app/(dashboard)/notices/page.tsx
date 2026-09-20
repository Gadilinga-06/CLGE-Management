import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NoticesClient } from "./client";

export default async function NoticesPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();

  const { data: notices } = await supabase
    .from("notices")
    .select(`
      id, title, content, category, target_role, department_id, course_id, semester_id, section_id, created_at,
      departments (id, name),
      courses (id, name),
      semesters (id, semester_number),
      sections (id, name),
      profiles (id, first_name, last_name)
    `)
    .order("created_at", { ascending: false });

  const canCreate = context.roles.includes("SUPER_ADMIN") ||
    context.roles.includes("COLLEGE_ADMIN") ||
    context.roles.includes("PRINCIPAL") ||
    context.roles.includes("HOD");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("college_id", context.profile.college_id);

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .in("department_id", (departments || []).map((d: { id: string }) => d.id));

  const { data: semesters } = await supabase
    .from("semesters")
    .select("id, semester_number, course_id")
    .in("course_id", (courses || []).map((c: { id: string }) => c.id));

  const { data: sections } = await supabase
    .from("sections")
    .select("id, name, semester_id")
    .in("semester_id", (semesters || []).map((s: { id: string }) => s.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notices</h2>
          <p className="text-muted-foreground">View and manage college notices.</p>
        </div>
      </div>
      <NoticesClient
        notices={notices || []}
        canCreate={canCreate}
        departments={departments || []}
        courses={courses || []}
        semesters={semesters || []}
        sections={sections || []}
        userId={context.user.id}
      />
    </div>
  );
}
