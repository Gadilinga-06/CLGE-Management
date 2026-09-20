import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyEventsClient } from "./client";

export default async function MyEventsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("STUDENT")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (!student) redirect("/");

  const { data: events } = await supabase
    .from("events")
    .select(`
      id, title, description, organizer_id, venue, start_date, end_date,
      capacity, status, created_at, category, updated_at, college_id
    `)
    .eq("college_id", context.profile.college_id)
    .order("start_date", { ascending: false });

  const { data: myRegistrations } = await supabase
    .from("event_registrations")
    .select("id, event_id, status, registered_at, attended_at")
    .eq("student_id", student.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Events</h2>
          <p className="text-muted-foreground">Browse and register for college events.</p>
        </div>
      </div>
      <MyEventsClient
        events={events || []}
        myRegistrations={myRegistrations || []}
      />
    </div>
  );
}
