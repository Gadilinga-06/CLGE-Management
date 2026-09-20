/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function generateTempPassword(): string {
  return `Tmp${crypto.randomBytes(8).toString("hex")}!1A`;
}

export async function createFaculty(formData: FormData) {
  const context = await requirePermission("faculty.create");
  const collegeId = context.profile.college_id;
  
  const employee_id = formData.get("employee_id") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const email = formData.get("email") as string;
  
  const department_id = formData.get("department_id") as string || null;
  const designation = formData.get("designation") as string;
  const qualification = formData.get("qualification") as string || null;
  const joining_date = formData.get("joining_date") as string || null;
  const status = formData.get("status") as string || "ACTIVE";

  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: existingFaculty } = await supabase
    .from("faculty")
    .select("id")
    .eq("college_id", collegeId)
    .eq("employee_id", employee_id)
    .single();

  if (existingFaculty) return { error: "Employee ID already exists." };

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: generateTempPassword(),
    email_confirm: true,
    user_metadata: { college_id: collegeId, first_name, last_name }
  });

  if (authError || !authUser.user) return { error: authError?.message || "Failed to create user account" };

  const userId = authUser.user.id;

  const { data: facultyRole } = await supabase.from("roles").select("id").eq("name", "FACULTY").single();
  
  if (facultyRole) {
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role_id: facultyRole.id,
      college_id: collegeId
    });
  }

  const newFaculty = {
    id: userId,
    college_id: collegeId,
    employee_id,
    department_id,
    designation,
    qualification,
    joining_date,
    status
  };

  const { error: insertError } = await adminClient.from("faculty").insert(newFaculty);
  if (insertError) return { error: insertError.message };

  await logAudit(context.user.id, "CREATE", "faculty", userId, null, newFaculty);
  revalidatePath("/faculty");
  return { success: true, id: userId };
}

export async function updateFaculty(id: string, formData: FormData) {
  const context = await requirePermission("faculty.update");
  const collegeId = context.profile.college_id;
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const department_id = formData.get("department_id") as string || null;
  const designation = formData.get("designation") as string;
  const qualification = formData.get("qualification") as string || null;
  const joining_date = formData.get("joining_date") as string || null;
  const status = formData.get("status") as string || "ACTIVE";

  const { data: oldData } = await supabase.from("faculty").select("*").eq("id", id).eq("college_id", collegeId).single();
  if (!oldData) return { error: "Faculty not found." };

  const newData = {
    department_id,
    designation,
    qualification,
    joining_date,
    status,
    updated_at: new Date().toISOString()
  };

  const { error } = await adminClient.from("faculty").update(newData).eq("id", id).eq("college_id", collegeId);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "faculty", id, oldData, newData);
  revalidatePath("/faculty");
  revalidatePath(`/faculty/${id}`);
  return { success: true };
}

export async function deleteFaculty(id: string) {
  const context = await requirePermission("faculty.delete");
  const adminClient = createAdminClient();
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("faculty").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Faculty not found." };

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "faculty", id, oldData, null);
  revalidatePath("/faculty");
  return { success: true };
}

// Assignments
export async function assignFacultyToAcademic(facultyId: string, formData: FormData) {
  const context = await requirePermission("faculty.update");
  const collegeId = context.profile.college_id;
  const adminClient = createAdminClient();

  const subject_id = formData.get("subject_id") as string;
  const section_id = formData.get("section_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const academic_year_id = formData.get("academic_year_id") as string;

  if (!subject_id || !section_id || !semester_id || !academic_year_id) {
    return { error: "All fields are required" };
  }

  const newAssignment = {
    faculty_id: facultyId,
    college_id: collegeId,
    subject_id,
    section_id,
    semester_id,
    academic_year_id
  };

  const { error } = await adminClient.from("faculty_assignments").insert(newAssignment);
  if (error) {
    if (error.code === '23505') {
      return { error: "This exact assignment already exists." };
    }
    return { error: error.message };
  }

  await logAudit(context.user.id, "CREATE", "faculty_assignments", facultyId, null, newAssignment);
  revalidatePath(`/faculty/${facultyId}`);
  return { success: true };
}

export async function removeFacultyAssignment(assignmentId: string, facultyId: string) {
  const context = await requirePermission("faculty.update");
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("faculty_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("college_id", context.profile.college_id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "faculty_assignments", assignmentId, null, null);
  revalidatePath(`/faculty/${facultyId}`);
  return { success: true };
}
