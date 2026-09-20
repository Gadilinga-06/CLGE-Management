/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyHostelClient } from "./client";

export default async function MyHostelPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  let allocation: any = null;
  let complaints: any[] = [];
  let visitors: any[] = [];

  if (student) {
    const [{ data: alloc }, { data: comp }, { data: vis }] = await Promise.all([
      supabase
        .from("hostel_allocations")
        .select(`
          id, allocation_date, status, notes,
          hostel_beds(bed_number, hostel_rooms(room_number, room_type, has_ac, has_attached_bath, monthly_rent, hostel_blocks(name, floor_number, hostels(name, type))))
        `)
        .eq("student_id", student.id)
        .eq("status", "ALLOCATED")
        .maybeSingle(),

      supabase
        .from("hostel_complaints")
        .select("id, category, title, description, status, created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("hostel_visitors")
        .select("id, visitor_name, relation, check_in_time, check_out_time, status")
        .eq("student_id", student.id)
        .order("check_in_time", { ascending: false })
        .limit(20),
    ]);

    allocation = alloc;
    complaints = comp || [];
    visitors = vis || [];
  }

  const { data: hostels } = await supabase
    .from("hostels")
    .select("id, name, type")
    .eq("college_id", ctx.profile.college_id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Hostel</h2>
        <p className="text-muted-foreground">View your room details, submit complaints, and track visitors.</p>
      </div>
      <MyHostelClient
        student={student}
        allocation={allocation}
        complaints={complaints}
        visitors={visitors}
        hostels={hostels || []}
        collegeId={ctx.profile.college_id}
      />
    </div>
  );
}
