"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  const context = await requirePermission("departments.create");
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const collegeId = context.profile.college_id;

  const supabase = createAdminClient();

  const newData = { college_id: collegeId, name, code };
  const { data, error } = await supabase.from("departments").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "departments", data.id, null, newData);
  revalidatePath("/departments");
  return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
  const context = await requirePermission("departments.update");
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("departments").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Department not found or access denied." };

  const newData = { name, code, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("departments").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "departments", id, oldData, newData);
  revalidatePath("/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const context = await requirePermission("departments.delete");
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("departments").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Department not found or access denied." };

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "departments", id, oldData, null);
  revalidatePath("/departments");
  return { success: true };
}
