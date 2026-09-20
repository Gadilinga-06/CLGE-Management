/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createTimetableSlot(formData: FormData) {
  const context = await requirePermission("timetable.create");
  const collegeId = context.profile.college_id;
  
  const academic_year_id = formData.get("academic_year_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const section_id = formData.get("section_id") as string;
  const subject_id = formData.get("subject_id") as string;
  const faculty_id = formData.get("faculty_id") as string;
  const room_id = formData.get("room_id") as string;
  const day_of_week = formData.get("day_of_week") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;

  if (start_time >= end_time) {
    return { error: "End time must be strictly after start time." };
  }

  const supabase = createAdminClient();

  // CONFLICT DETECTION
  // We need to query for existing slots on the same day_of_week that overlap with start_time and end_time
  // An overlap exists if: (existing_start < new_end) AND (existing_end > new_start)
  
  const { data: overlappingSlots } = await supabase
    .from("timetable_slots")
    .select(`
      id, faculty_id, room_id, section_id, start_time, end_time,
      faculty (profiles (first_name, last_name)),
      rooms (room_number),
      sections (name)
    `)
    .eq("college_id", collegeId)
    .eq("day_of_week", day_of_week)
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (overlappingSlots && overlappingSlots.length > 0) {
    // Check specific conflicts
    for (const slot of overlappingSlots) {
      if (slot.faculty_id === faculty_id) {
        return { error: `Faculty Double Booking: Professor is already teaching from ${slot.start_time} to ${slot.end_time}.` };
      }
      if (slot.room_id === room_id) {
        // @ts-expect-error type override
        return { error: `Room Double Booking: Room ${slot.rooms?.room_number} is already occupied from ${slot.start_time} to ${slot.end_time}.` };
      }
      if (slot.section_id === section_id) {
        // @ts-expect-error type override
        return { error: `Section Double Booking: Section ${slot.sections?.name} already has a class scheduled from ${slot.start_time} to ${slot.end_time}.` };
      }
    }
  }

  const newSlot = {
    college_id: collegeId,
    academic_year_id,
    semester_id,
    section_id,
    subject_id,
    faculty_id,
    room_id,
    day_of_week,
    start_time,
    end_time
  };

  const { data, error } = await supabase.from("timetable_slots").insert(newSlot).select().single();
  
  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "timetable_slots", data.id, null, newSlot);
  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteTimetableSlot(id: string) {
  const context = await requirePermission("timetable.delete");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("timetable_slots")
    .delete()
    .eq("id", id)
    .eq("college_id", context.profile.college_id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "timetable_slots", id, null, null);
  revalidatePath("/timetable");
  return { success: true };
}
