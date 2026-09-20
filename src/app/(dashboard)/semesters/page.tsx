import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SemestersClient } from "./client";

export default async function SemestersPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canCreate = context.permissions.includes("departments.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("departments.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("departments.delete") || context.roles.includes("SUPER_ADMIN");

  const supabase = await createClient();
  
  const { data: departments } = await supabase.from("departments").select("id").eq("college_id", context.profile.college_id);
  const deptIds = departments?.map(d => d.id) || [];
  
  if (deptIds.length === 0) {
    return <div><h2 className="text-2xl font-bold mb-4">Semesters</h2><p>Please create a Department and Program first.</p></div>;
  }

  const { data: courses } = await supabase.from("courses").select("id, name, code").in("department_id", deptIds);
  const courseIds = courses?.map(c => c.id) || [];

  if (courseIds.length === 0) {
    return <div><h2 className="text-2xl font-bold mb-4">Semesters</h2><p>Please create a Program first.</p></div>;
  }

  const { data: semesters } = await supabase
    .from("semesters")
    .select("*, courses(name, code)")
    .in("course_id", courseIds)
    .order("semester_number");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Semesters</h2>
          <p className="text-muted-foreground">Manage semesters for programs.</p>
        </div>
      </div>
      <SemestersClient 
        data={semesters || []} 
        courses={courses || []}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
