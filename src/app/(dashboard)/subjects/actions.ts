"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createSubject(formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const semester_id = formData.get("semester_id") as string;
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const credits = parseInt(formData.get("credits") as string);
  const type = formData.get("type") as string;
  const collegeId = context.profile.college_id;

  const supabase = await createClient();

  const { data: semester } = await supabase.from("semesters").select("id, courses!inner(departments!inner(college_id))").eq("id", semester_id).single();
  if (!semester || (semester.courses as unknown as { departments: { college_id: string } }).departments.college_id !== collegeId) {
    return { error: "Semester not found or access denied." };
  }

  const newData = { semester_id, name, code, credits, type };
  const { data, error } = await supabase.from("subjects").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "subjects", data.id, null, newData);
  revalidatePath("/subjects");
  return { success: true };
}

export async function updateSubject(id: string, formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const semester_id = formData.get("semester_id") as string;
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const credits = parseInt(formData.get("credits") as string);
  const type = formData.get("type") as string;
  
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("subjects").select("*, semesters!inner(courses!inner(departments!inner(college_id)))").eq("id", id).single();
  if (!oldData || (oldData.semesters as unknown as { courses: { departments: { college_id: string } } }).courses.departments.college_id !== context.profile.college_id) {
    return { error: "Subject not found or access denied." };
  }

  const newData = { semester_id, name, code, credits, type, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("subjects").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "subjects", id, oldData, newData);
  revalidatePath("/subjects");
  return { success: true };
}

export async function deleteSubject(id: string) {
  const context = await requirePermission("departments.delete");
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("subjects").select("*, semesters!inner(courses!inner(departments!inner(college_id)))").eq("id", id).single();
  if (!oldData || (oldData.semesters as unknown as { courses: { departments: { college_id: string } } }).courses.departments.college_id !== context.profile.college_id) {
    return { error: "Subject not found or access denied." };
  }

  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "subjects", id, oldData, null);
  revalidatePath("/subjects");
  return { success: true };
}
