import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProgramsClient } from "./client";

export default async function ProgramsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  // We reuse department permissions or allow view to anyone in college
  const canCreate = context.permissions.includes("departments.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("departments.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("departments.delete") || context.roles.includes("SUPER_ADMIN");

  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("college_id", context.profile.college_id)
    .order("name");

  if (!departments || departments.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Programs</h2>
        <p className="text-muted-foreground">Please create a Department before managing Programs.</p>
      </div>
    );
  }

  const deptIds = departments.map(d => d.id);
  const { data: programs } = await supabase
    .from("courses")
    .select("*, departments(name)")
    .in("department_id", deptIds)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Programs (Courses)</h2>
          <p className="text-muted-foreground">Manage academic programs offered by your college.</p>
        </div>
      </div>
      <ProgramsClient 
        data={programs || []} 
        departments={departments}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
