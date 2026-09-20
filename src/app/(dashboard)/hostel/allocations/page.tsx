import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllocationsClient } from "./client";

export default async function AllocationsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const isWarden = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "WARDEN"].includes(r));
  if (!isWarden) redirect("/unauthorized");

  const supabase = await createClient();

  const [
    { data: allocations },
    { data: availableBeds },
    { data: students },
    { data: academicYears },
  ] = await Promise.all([
    supabase
      .from("hostel_allocations")
      .select(`
        id, allocation_date, vacation_date, status, notes,
        students(id, admission_number, profiles(first_name, last_name)),
        hostel_beds(
          id, bed_number,
          hostel_rooms(
            room_number, monthly_rent,
            hostel_blocks(name, hostels(name, type))
          )
        ),
        academic_years(year_range)
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("hostel_beds")
      .select(`
        id, bed_number,
        hostel_rooms(
          id, room_number, room_type, monthly_rent,
          hostel_blocks(id, name, hostels(id, name, type, college_id))
        )
      `)
      .eq("status", "AVAILABLE"),

    supabase
      .from("students")
      .select("id, admission_number, profiles(first_name, last_name)")
      .eq("status", "ACTIVE"),

    supabase
      .from("academic_years")
      .select("id, year_range")
      .eq("college_id", ctx.profile.college_id),
  ]);

  // Filter available beds to this college only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collegeBeds = (availableBeds || []).filter((b: any) =>
    b.hostel_rooms?.hostel_blocks?.hostels?.college_id === ctx.profile.college_id
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bed Allocations</h2>
        <p className="text-muted-foreground">Assign, transfer, and vacate hostel beds.</p>
      </div>
      <AllocationsClient
        allocations={allocations || []}
        availableBeds={collegeBeds}
        students={students || []}
        academicYears={academicYears || []}
      />
    </div>
  );
}
