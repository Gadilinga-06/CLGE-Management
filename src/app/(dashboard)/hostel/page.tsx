/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HostelDashboardClient } from "./client";

export default async function HostelPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isWarden = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "WARDEN"].includes(r));
  if (!isWarden) redirect("/unauthorized");

  const supabase = await createClient();

  const { data: hostels } = await supabase
    .from("hostels")
    .select(`
      id, name, type, description, total_floors, warden_id,
      profiles(first_name, last_name),
      hostel_blocks(
        id, name, floor_number,
        hostel_rooms(
          id, room_number, capacity, room_type, has_ac, has_attached_bath, monthly_rent,
          hostel_beds(id, bed_number, status)
        )
      )
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("name");

  // Stats
  let totalBeds = 0, occupiedBeds = 0, availableBeds = 0;
  (hostels || []).forEach((h: any) => {
    h.hostel_blocks?.forEach((b: any) => {
      b.hostel_rooms?.forEach((r: any) => {
        r.hostel_beds?.forEach((bed: any) => {
          totalBeds++;
          if (bed.status === "OCCUPIED") occupiedBeds++;
          else if (bed.status === "AVAILABLE") availableBeds++;
        });
      });
    });
  });

  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Wardens/admins for assignment
  const { data: wardenProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("college_id", ctx.profile.college_id)
    .eq("is_active", true);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hostel Management</h2>
        <p className="text-muted-foreground">Manage hostels, blocks, rooms, beds and allocations.</p>
      </div>
      <HostelDashboardClient
        hostels={hostels || []}
        stats={{ totalBeds, occupiedBeds, availableBeds, occupancyPct }}
        wardenProfiles={wardenProfiles || []}
      />
    </div>
  );
}
