import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FacultyClient } from "./client";

export default async function FacultyPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canCreate = context.permissions.includes("faculty.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("faculty.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("faculty.delete") || context.roles.includes("SUPER_ADMIN");

  const supabase = await createClient();
  
  const { data: faculty } = await supabase
    .from("faculty")
    .select(`
      *,
      profiles (first_name, last_name, email, avatar_url, phone),
      departments (name)
    `)
    .eq("college_id", context.profile.college_id)
    .order("created_at", { ascending: false });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("college_id", context.profile.college_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty</h2>
          <p className="text-muted-foreground">Manage faculty members and staff.</p>
        </div>
      </div>
      <FacultyClient 
        data={faculty || []} 
        departments={departments || []}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
