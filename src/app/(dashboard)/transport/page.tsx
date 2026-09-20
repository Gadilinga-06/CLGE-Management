import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransportDashboardClient } from "./client";

export default async function TransportPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isManager = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "TRANSPORT_MANAGER"].includes(r));
  if (!isManager) redirect("/unauthorized");

  const supabase = await createClient();

  const [
    { count: totalBuses },
    { count: activeBuses },
    { count: totalDrivers },
    { count: totalRoutes },
    { count: totalStudents },
    { data: recentAssignments },
  ] = await Promise.all([
    supabase.from("buses").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
    supabase.from("buses").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id).eq("status", "ACTIVE"),
    supabase.from("drivers").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
    supabase.from("routes").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
    supabase.from("transport_assignments").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase
      .from("transport_assignments")
      .select(`
        id, status, created_at,
        students(admission_number, profiles(first_name, last_name)),
        routes(name),
        bus_stops(name, pickup_time)
      `)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Route details
  const { data: routes } = await supabase
    .from("routes")
    .select(`
      id, name, start_point, end_point,
      buses(registration_number, capacity, model, status),
      drivers(name, phone),
      bus_stops(name, pickup_time, drop_time, stop_order)
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("name");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transport Management</h2>
        <p className="text-muted-foreground">Manage buses, drivers, routes, and student transport assignments.</p>
      </div>
      <TransportDashboardClient
        stats={{
          totalBuses: totalBuses || 0,
          activeBuses: activeBuses || 0,
          totalDrivers: totalDrivers || 0,
          totalRoutes: totalRoutes || 0,
          totalStudents: totalStudents || 0,
        }}
        recentAssignments={recentAssignments || []}
        routes={routes || []}
      />
    </div>
  );
}
