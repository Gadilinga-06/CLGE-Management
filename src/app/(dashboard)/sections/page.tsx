/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SectionsClient } from "./client";

export default async function SectionsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canCreate = context.permissions.includes("departments.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("departments.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("departments.delete") || context.roles.includes("SUPER_ADMIN");

  const supabase = await createClient();
  
  // Need to resolve college -> departments -> courses -> semesters -> sections
  const { data: departments } = await supabase.from("departments").select("id").eq("college_id", context.profile.college_id);
  const deptIds = departments?.map(d => d.id) || [];
  
  if (deptIds.length === 0) return <div><h2 className="text-2xl font-bold mb-4">Sections</h2><p>Please create a Department first.</p></div>;

  const { data: courses } = await supabase.from("courses").select("id").in("department_id", deptIds);
  const courseIds = courses?.map(c => c.id) || [];

  if (courseIds.length === 0) return <div><h2 className="text-2xl font-bold mb-4">Sections</h2><p>Please create a Program first.</p></div>;

  const { data: semesters } = await supabase.from("semesters").select("id, semester_number, courses(name, code)").in("course_id", courseIds);
  const semIds = semesters?.map(s => s.id) || [];

  if (semIds.length === 0) return <div><h2 className="text-2xl font-bold mb-4">Sections</h2><p>Please create a Semester first.</p></div>;

  const { data: sections } = await supabase
    .from("sections")
    .select("*, semesters(semester_number, courses(name, code))")
    .in("semester_id", semIds)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sections</h2>
          <p className="text-muted-foreground">Manage sections (batches) for semesters.</p>
        </div>
      </div>
      <SectionsClient 
        data={sections || []} 
        semesters={semesters as any}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}

