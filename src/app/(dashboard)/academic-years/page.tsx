import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcademicYearsClient } from "./client";

export default async function AcademicYearsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canManage = context.permissions.includes("settings.manage") || context.roles.includes("SUPER_ADMIN");
  
  if (!canManage && !context.permissions.includes("settings.view")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: academicYears } = await supabase
    .from("academic_years")
    .select("*")
    .eq("college_id", context.profile.college_id)
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Academic Years</h2>
          <p className="text-muted-foreground">Manage your institution&apos;s academic calendar.</p>
        </div>
      </div>
      <AcademicYearsClient 
        data={academicYears || []} 
        canManage={canManage}
      />
    </div>
  );
}
