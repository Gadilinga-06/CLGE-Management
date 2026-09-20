"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createAcademicYear(formData: FormData) {
  const context = await requirePermission("settings.manage");
  
  const name = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;
  const is_active = formData.get("is_active") === "on";

  const supabase = await createClient();
  const collegeId = context.profile.college_id;

  if (is_active) {
    await supabase.from("academic_years").update({ is_active: false }).eq("college_id", collegeId);
  }

  const newData = { name, start_date, end_date, is_active, college_id: collegeId };
  const { data, error } = await supabase.from("academic_years").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "academic_years", data.id, null, newData);
  revalidatePath("/academic-years");
  return { success: true };
}

export async function updateAcademicYear(id: string, formData: FormData) {
  const context = await requirePermission("settings.manage");
  const name = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;
  const is_active = formData.get("is_active") === "on";
  
  const supabase = await createClient();
  const collegeId = context.profile.college_id;
  
  const { data: oldData } = await supabase.from("academic_years").select("*").eq("id", id).eq("college_id", collegeId).single();
  if (!oldData) return { error: "Academic Year not found." };

  if (is_active && !oldData.is_active) {
    await supabase.from("academic_years").update({ is_active: false }).eq("college_id", collegeId);
  }

  const newData = { name, start_date, end_date, is_active, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("academic_years").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "academic_years", id, oldData, newData);
  revalidatePath("/academic-years");
  return { success: true };
}

export async function deleteAcademicYear(id: string) {
  const context = await requirePermission("settings.manage");
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("academic_years").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Academic Year not found." };

  const { error } = await supabase.from("academic_years").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "academic_years", id, oldData, null);
  revalidatePath("/academic-years");
  return { success: true };
}
