"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createSemester(formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const course_id = formData.get("course_id") as string;
  const semester_number = parseInt(formData.get("semester_number") as string);
  const name = formData.get("name") as string;
  const collegeId = context.profile.college_id;

  const supabase = createAdminClient();

  const { data: course } = await supabase.from("courses").select("id, departments!inner(college_id)").eq("id", course_id).single();
  if (!course || (course.departments as unknown as { college_id: string }).college_id !== collegeId) {
    return { error: "Course not found or access denied." };
  }

  const newData = { course_id, semester_number, name };
  const { data, error } = await supabase.from("semesters").insert(newData).select().single();

  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "semesters", data.id, null, newData);
  revalidatePath("/semesters");
  return { success: true };
}

export async function updateSemester(id: string, formData: FormData) {
  const context = await requirePermission("departments.update");
  
  const course_id = formData.get("course_id") as string;
  const semester_number = parseInt(formData.get("semester_number") as string);
  const name = formData.get("name") as string;
  
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("semesters").select("*, courses!inner(departments!inner(college_id))").eq("id", id).single();
  if (!oldData || (oldData.courses as unknown as { departments: { college_id: string } }).departments.college_id !== context.profile.college_id) {
    return { error: "Semester not found or access denied." };
  }

  const newData = { course_id, semester_number, name };
  const { error } = await supabase.from("semesters").update(newData).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "semesters", id, oldData, newData);
  revalidatePath("/semesters");
  return { success: true };
}

export async function deleteSemester(id: string) {
  const context = await requirePermission("departments.delete");
  const supabase = createAdminClient();
  
  const { data: oldData } = await supabase.from("semesters").select("*, courses!inner(departments!inner(college_id))").eq("id", id).single();
  if (!oldData || (oldData.courses as unknown as { departments: { college_id: string } }).departments.college_id !== context.profile.college_id) {
    return { error: "Semester not found or access denied." };
  }

  const { error } = await supabase.from("semesters").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "semesters", id, oldData, null);
  revalidatePath("/semesters");
  return { success: true };
}
