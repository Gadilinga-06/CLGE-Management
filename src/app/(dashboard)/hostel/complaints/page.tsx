import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ComplaintsClient } from "./client";

export default async function HostelComplaintsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const isWarden = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "WARDEN"].includes(r));
  if (!isWarden) redirect("/unauthorized");

  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from("hostel_complaints")
    .select(`
      id, category, title, description, status, created_at, resolved_at,
      students(admission_number, profiles(first_name, last_name)),
      hostels(name)
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hostel Complaints</h2>
        <p className="text-muted-foreground">Review and resolve hostel complaints.</p>
      </div>
      <ComplaintsClient complaints={complaints || []} />
    </div>
  );
}
