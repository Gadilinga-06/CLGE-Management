import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EventsClient } from "./client";

export default async function EventsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();
  const isStaff = context.roles.includes("SUPER_ADMIN") ||
    context.roles.includes("COLLEGE_ADMIN") ||
    context.roles.includes("PRINCIPAL") ||
    context.roles.includes("HOD") ||
    context.roles.includes("FACULTY");

  const { data: events } = await supabase
    .from("events")
    .select(`
      id, title, description, organizer_id, venue, start_date, end_date,
      capacity, status, created_at, category, updated_at, college_id
    `)
    .eq("college_id", context.profile.college_id)
    .order("start_date", { ascending: false });

  // Get registration counts per event
  const eventIds = (events || []).map((e: { id: string }) => e.id);
  const { data: regCounts } = await supabase
    .from("event_registrations")
    .select("event_id, status")
    .in("event_id", eventIds.length > 0 ? eventIds : ["00000000-0000-0000-0000-000000000000"]);

  // Aggregate counts per event
  const registrationMap: Record<string, { total: number; registered: number; attended: number }> = {};
  for (const reg of regCounts || []) {
    if (!registrationMap[reg.event_id]) {
      registrationMap[reg.event_id] = { total: 0, registered: 0, attended: 0 };
    }
    registrationMap[reg.event_id].total++;
    if (reg.status === "REGISTERED") registrationMap[reg.event_id].registered++;
    if (reg.status === "ATTENDED") registrationMap[reg.event_id].attended++;
  }

  // Get registrations with details for staff view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registrations: any[] = [];
  if (isStaff) {
    const { data: regs } = await supabase
      .from("event_registrations")
      .select(`
        id, event_id, student_id, status, registered_at, attended_at,
        students (id, admission_number, user_id, profiles (first_name, last_name))
      `)
      .in("event_id", eventIds.length > 0 ? eventIds : ["00000000-0000-0000-0000-000000000000"]);
    registrations = regs || [];
  }

  // Get student's own registrations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let myRegistrations: any[] = [];
  let studentId: string | undefined;
  if (!isStaff) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (student) {
      studentId = student.id;
      const { data: myRegs } = await supabase
        .from("event_registrations")
        .select("id, event_id, status, registered_at")
        .eq("student_id", student.id);
      myRegistrations = myRegs || [];
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">Manage and view college events.</p>
        </div>
      </div>
      <EventsClient
        events={events || []}
        registrations={registrations}
        myRegistrations={myRegistrations}
        registrationMap={registrationMap}
        isStaff={isStaff}
        studentId={studentId}
      />
    </div>
  );
}
