"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createSection(formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const semester_id = formData.get("semester_id") as string;
  const name = formData.get("name") as string;
  const collegeId = context.profile.college_id;

  const supabase = createAdminClient();

  const { data: semester } = await supabase.from("semesters").select("id, courses!inner(departments!inner(college_id))").eq("id", semester_id).single();
  if (!semester || (semester.courses as unknown as { departments: { college_id: string } }).departments.college_id !== collegeId) {
    return { error: "Semester not found or access denied." };
  }

  const newData = { semester_id, name };
  const { data, error } = await supabase.from("sections").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "sections", data.id, null, newData);
  revalidatePath("/sections");
  return { success: true };
}

export async function updateSection(id: string, formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const semester_id = formData.get("semester_id") as string;
  const name = formData.get("name") as string;
  
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("sections").select("*, semesters!inner(courses!inner(departments!inner(college_id)))").eq("id", id).single();
  if (!oldData || (oldData.semesters as unknown as { courses: { departments: { college_id: string } } }).courses.departments.college_id !== context.profile.college_id) {
    return { error: "Section not found or access denied." };
  }

  const newData = { semester_id, name, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("sections").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "sections", id, oldData, newData);
  revalidatePath("/sections");
  return { success: true };
}

export async function deleteSection(id: string) {
  const context = await requirePermission("departments.delete");
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("sections").select("*, semesters!inner(courses!inner(departments!inner(college_id)))").eq("id", id).single();
  if (!oldData || (oldData.semesters as unknown as { courses: { departments: { college_id: string } } }).courses.departments.college_id !== context.profile.college_id) {
    return { error: "Section not found or access denied." };
  }

  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "sections", id, oldData, null);
  revalidatePath("/sections");
  return { success: true };
}
