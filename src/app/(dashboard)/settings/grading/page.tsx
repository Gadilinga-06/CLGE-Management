import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GradingClient } from "./client";

export default async function GradingSettingsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("grading_rules")
    .select("*")
    .eq("college_id", context.profile.college_id)
    .order("grade_point", { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grading System Configuration</h2>
          <p className="text-muted-foreground">Define your college&apos;s grade letters, points, and percentage brackets.</p>
        </div>
      </div>
      <GradingClient initialRules={rules || []} />
    </div>
  );
}
