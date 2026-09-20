"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createRoom(formData: FormData) {
  const context = await requirePermission("settings.manage"); // Or specific facilities permission
  
  const room_number = formData.get("room_number") as string;
  const building = formData.get("building") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const room_type = formData.get("room_type") as string;
  const status = formData.get("status") as string;
  const collegeId = context.profile.college_id;

  const supabase = await createClient();

  const newData = { college_id: collegeId, room_number, building, capacity, room_type, status };
  const { data, error } = await supabase.from("rooms").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "rooms", data.id, null, newData);
  revalidatePath("/rooms");
  return { success: true };
}

export async function updateRoom(id: string, formData: FormData) {
  const context = await requirePermission("settings.manage");
  
  const room_number = formData.get("room_number") as string;
  const building = formData.get("building") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const room_type = formData.get("room_type") as string;
  const status = formData.get("status") as string;
  
  const supabase = await createClient();
  const collegeId = context.profile.college_id;
  
  const { data: oldData } = await supabase.from("rooms").select("*").eq("id", id).eq("college_id", collegeId).single();
  if (!oldData) return { error: "Room not found." };

  const newData = { room_number, building, capacity, room_type, status, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("rooms").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "rooms", id, oldData, newData);
  revalidatePath("/rooms");
  return { success: true };
}

export async function deleteRoom(id: string) {
  const context = await requirePermission("settings.manage");
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("rooms").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Room not found." };

  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "rooms", id, oldData, null);
  revalidatePath("/rooms");
  return { success: true };
}
