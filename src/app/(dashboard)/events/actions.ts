/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// STAFF: CREATE EVENT
// ─────────────────────────────────────────

export async function createEvent(formData: FormData) {
  const ctx = await requirePermission("events.create");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    organizer_id: ctx.user.id,
    venue: formData.get("venue") as string || null,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
    category: formData.get("category") as string || "GENERAL",
    status: "UPCOMING",
  };

  const { data, error } = await supabase.from("events").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "events", data.id, null, payload);
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE EVENT
// ─────────────────────────────────────────

export async function updateEvent(id: string, formData: FormData) {
  const ctx = await requirePermission("events.update");
  const supabase = createAdminClient();

  const updates = {
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    venue: formData.get("venue") as string || null,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
    category: formData.get("category") as string || "GENERAL",
    status: formData.get("status") as string || "UPCOMING",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("events").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "events", id, null, updates);
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: DELETE EVENT
// ─────────────────────────────────────────

export async function deleteEvent(id: string) {
  const ctx = await requirePermission("events.delete");
  const supabase = createAdminClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "events", id, null, null);
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { success: true };
}

// ─────────────────────────────────────────
// STUDENT: REGISTER FOR EVENT
// ─────────────────────────────────────────

export async function registerForEvent(eventId: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!student) return { error: "Student profile not found." };

  // Check event exists and has capacity
  const { data: event } = await supabase
    .from("events")
    .select("id, capacity, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return { error: "Event not found." };
  if ((event as any).status === "CANCELLED") return { error: "Event is cancelled." };

  // Check not already registered
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (existing) return { error: "Already registered for this event." };

  // Check capacity
  if ((event as any).capacity) {
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "REGISTERED");

    if (count && count >= (event as any).capacity) {
      return { error: "Event is at full capacity." };
    }
  }

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    student_id: student.id,
    status: "REGISTERED",
  });

  if (error) return { error: error.message };
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { success: true };
}

// ─────────────────────────────────────────
// STUDENT: CANCEL REGISTRATION
// ─────────────────────────────────────────

export async function cancelRegistration(eventId: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!student) return { error: "Student profile not found." };

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "CANCELLED" })
    .eq("event_id", eventId)
    .eq("student_id", student.id);

  if (error) return { error: error.message };
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: MARK ATTENDANCE
// ─────────────────────────────────────────

export async function markAttendance(registrationId: string) {
  const ctx = await requirePermission("events.update");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "ATTENDED", attended_at: new Date().toISOString() })
    .eq("id", registrationId);

  if (error) return { error: error.message };
  revalidatePath("/events");
  return { success: true };
}
