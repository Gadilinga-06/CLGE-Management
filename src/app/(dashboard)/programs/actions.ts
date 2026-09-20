"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createProgram(formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const department_id = formData.get("department_id") as string;
  const duration_years = parseInt(formData.get("duration_years") as string);
  const degree_type = formData.get("degree_type") as string;
  const collegeId = context.profile.college_id;

  const supabase = createAdminClient();

  const { data: dept } = await supabase.from("departments").select("id").eq("id", department_id).eq("college_id", collegeId).single();
  if (!dept) return { error: "Department not found or access denied." };

  const newData = { name, code, department_id, duration_years, degree_type };
  const { data, error } = await supabase.from("courses").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "courses", data.id, null, newData);
  revalidatePath("/programs");
  return { success: true };
}

export async function updateProgram(id: string, formData: FormData) {
  const context = await requirePermission("departments.update");
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const department_id = formData.get("department_id") as string;
  const duration_years = parseInt(formData.get("duration_years") as string);
  const degree_type = formData.get("degree_type") as string;
  
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("courses").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Program not found or access denied." };

  const newData = { name, code, department_id, duration_years, degree_type, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("courses").update(newData).eq("id", id).eq("college_id", context.profile.college_id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "courses", id, oldData, newData);
  revalidatePath("/programs");
  return { success: true };
}

export async function deleteProgram(id: string) {
  const context = await requirePermission("departments.delete");
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("courses").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Program not found or access denied." };

  const { error } = await supabase.from("courses").delete().eq("id", id).eq("college_id", context.profile.college_id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "courses", id, oldData, null);
  revalidatePath("/programs");
  return { success: true };
}
