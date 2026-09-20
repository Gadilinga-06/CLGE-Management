import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BusesClient } from "./client";

export default async function BusesPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isManager = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "TRANSPORT_MANAGER"].includes(r));
  if (!isManager) redirect("/unauthorized");

  const supabase = await createClient();

  const [{ data: buses }, { data: drivers }] = await Promise.all([
    supabase
      .from("buses")
      .select("*, drivers(id, name)")
      .eq("college_id", ctx.profile.college_id)
      .order("registration_number"),
    supabase
      .from("drivers")
      .select("*")
      .eq("college_id", ctx.profile.college_id)
      .order("name"),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Buses & Drivers</h2>
        <p className="text-muted-foreground">Manage your transport fleet and driver profiles.</p>
      </div>
      <BusesClient buses={buses || []} drivers={drivers || []} />
    </div>
  );
}
