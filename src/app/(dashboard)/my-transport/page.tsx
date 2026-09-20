import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyTransportClient } from "./client";

export default async function MyTransportPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .single();

  if (!student) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Transport</h2>
          <p className="text-muted-foreground">No transport assignment found.</p>
        </div>
      </div>
    );
  }

  const { data: assignment } = await supabase
    .from("transport_assignments")
    .select(`
      id, status, created_at,
      routes!inner(
        id, name, start_point, end_point,
        buses(registration_number, capacity, model),
        drivers(name, phone),
        bus_stops!inner(id, name, pickup_time, drop_time, stop_order)
      ),
      bus_stops!inner(id, name, pickup_time, drop_time, stop_order)
    `)
    .eq("student_id", student.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  // Get all stops on this route for the full route view
  let allStops: Array<{
    id: string;
    name: string;
    pickup_time: string;
    drop_time: string;
    stop_order: number;
  }> = [];
  const routeId = (assignment as { routes?: { id: string } } | null)?.routes?.id;
  if (routeId) {
    const { data: stops } = await supabase
      .from("bus_stops")
      .select("id, name, pickup_time, drop_time, stop_order")
      .eq("route_id", routeId)
      .order("stop_order");
    allStops = stops || [];
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Transport</h2>
        <p className="text-muted-foreground">Your transport assignment details.</p>
      </div>
      <MyTransportClient assignment={assignment} allStops={allStops} />
    </div>
  );
}
