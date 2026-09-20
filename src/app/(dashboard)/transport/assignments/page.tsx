import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssignmentsClient } from "./client";

export default async function AssignmentsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isManager = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "TRANSPORT_MANAGER"].includes(r));
  if (!isManager) redirect("/unauthorized");

  const supabase = await createClient();

  const [{ data: assignments }, { data: routes }, { data: students }, { data: academicYears }] = await Promise.all([
    supabase
      .from("transport_assignments")
      .select(`
        id, status, created_at,
        students(id, admission_number, profiles(first_name, last_name)),
        routes!inner(id, name, buses(registration_number, capacity)),
        bus_stops!inner(id, name, pickup_time)
      `)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false }),
    supabase
      .from("routes")
      .select("id, name, bus_id, buses(registration_number, capacity)")
      .eq("college_id", ctx.profile.college_id)
      .order("name"),
    supabase
      .from("students")
      .select("id, admission_number, profiles(first_name, last_name)")
      .eq("college_id", ctx.profile.college_id)
      .eq("status", "ACTIVE"),
    supabase
      .from("academic_years")
      .select("id, name")
      .eq("college_id", ctx.profile.college_id)
      .eq("is_active", true)
      .single(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transport Assignments</h2>
        <p className="text-muted-foreground">Assign students to routes and stops.</p>
      </div>
      <AssignmentsClient
        assignments={assignments || []}
        routes={routes || []}
        students={students || []}
        academicYearId={academicYears?.id || ""}
      />
    </div>
  );
}
