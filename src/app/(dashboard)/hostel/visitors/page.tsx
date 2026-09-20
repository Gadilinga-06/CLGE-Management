import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VisitorsClient } from "./client";

export default async function VisitorsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const isWarden = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "WARDEN"].includes(r));
  if (!isWarden) redirect("/unauthorized");

  const supabase = await createClient();

  const [{ data: visitors }, { data: hostels }, { data: students }] = await Promise.all([
    supabase
      .from("hostel_visitors")
      .select(`
        id, visitor_name, visitor_phone, relation, purpose, status, check_in_time, check_out_time,
        students(admission_number, profiles(first_name, last_name)),
        hostels(name)
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("check_in_time", { ascending: false })
      .limit(100),

    supabase.from("hostels").select("id, name").eq("college_id", ctx.profile.college_id),
    supabase.from("students").select("id, admission_number, profiles(first_name, last_name)").eq("status", "ACTIVE"),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Visitor Management</h2>
        <p className="text-muted-foreground">Log, track, and check out hostel visitors.</p>
      </div>
      <VisitorsClient visitors={visitors || []} hostels={hostels || []} students={students || []} />
    </div>
  );
}
