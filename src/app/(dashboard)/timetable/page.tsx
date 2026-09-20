import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TimetableClient } from "./client";

export default async function TimetablePage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();

  // Load all reference data for the dropdowns
  const [{ data: sections }, { data: subjects }, { data: faculty }, { data: rooms }, { data: slots }] = await Promise.all([
    supabase.from("sections").select("id, name, courses(name), semesters(id, academic_year_id)").eq("college_id", context.profile.college_id),
    supabase.from("subjects").select("id, name, subject_code").eq("college_id", context.profile.college_id),
    supabase.from("faculty").select("id, profiles(first_name, last_name)").eq("college_id", context.profile.college_id),
    supabase.from("rooms").select("id, room_number").eq("college_id", context.profile.college_id),
    supabase.from("timetable_slots").select(`
      id,
      day_of_week,
      start_time,
      end_time,
      section_id,
      faculty_id,
      room_id,
      subjects (name),
      faculty (profiles (first_name, last_name)),
      rooms (room_number),
      sections (name)
    `).eq("college_id", context.profile.college_id)
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:max-w-full print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Timetable Management</h2>
          <p className="text-muted-foreground">Schedule and manage classes, faculties, and rooms.</p>
        </div>
      </div>
      
      <TimetableClient 
        sections={sections || []}
        subjects={subjects || []}
        faculty={faculty || []}
        rooms={rooms || []}
        slots={slots || []}
        userRole={context.roles.includes("STUDENT") ? "STUDENT" : context.roles.includes("FACULTY") ? "FACULTY" : "ADMIN"}
        userId={context.user.id}
      />
    </div>
  );
}
