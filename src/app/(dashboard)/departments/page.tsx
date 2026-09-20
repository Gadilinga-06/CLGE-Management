import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DepartmentsClient } from "./client";

export default async function DepartmentsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.permissions.includes("departments.view") && !context.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .eq("college_id", context.profile.college_id)
    .order("name");

  const canCreate = context.permissions.includes("departments.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("departments.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("departments.delete") || context.roles.includes("SUPER_ADMIN");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage your college departments.</p>
        </div>
      </div>
      <DepartmentsClient 
        data={departments || []} 
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
