/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

export async function createStudent(formData: FormData) {
  const context = await requirePermission("students.create");
  const collegeId = context.profile.college_id;
  
  const admission_number = formData.get("admission_number") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const email = formData.get("email") as string;
  const dob = formData.get("dob") as string || null;
  const gender = formData.get("gender") as string || null;
  const address = formData.get("address") as string || null;
  
  const department_id = formData.get("department_id") as string || null;
  const course_id = formData.get("course_id") as string || null;
  const semester_id = formData.get("semester_id") as string || null;
  const section_id = formData.get("section_id") as string || null;
  const academic_year_id = formData.get("academic_year_id") as string || null;
  const admission_date = formData.get("admission_date") as string || null;
  const status = formData.get("status") as string || "ACTIVE";

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Check if admission number already exists in this college
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("college_id", collegeId)
    .eq("admission_number", admission_number)
    .single();

  if (existingStudent) {
    return { error: "Admission number already exists in this college." };
  }

  // 2. Create Auth User (triggers profile creation)
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: generateTempPassword(),
    email_confirm: true,
    user_metadata: {
      college_id: collegeId,
      first_name,
      last_name,
    }
  });

  if (authError || !authUser.user) {
    return { error: authError?.message || "Failed to create user account" };
  }

  const userId = authUser.user.id;

  // 3. Assign STUDENT role
  const { data: studentRole } = await supabase.from("roles").select("id").eq("name", "STUDENT").single();
  
  if (studentRole) {
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role_id: studentRole.id,
      college_id: collegeId
    });
  }

  // 4. Create Student Record
  const newStudent = {
    id: userId,
    college_id: collegeId,
    admission_number,
    dob,
    gender,
    address,
    department_id,
    course_id,
    semester_id,
    section_id,
    academic_year_id,
    admission_date,
    status
  };

  const { error: studentError } = await adminClient.from("students").insert(newStudent);

  if (studentError) {
    // Rollback might be needed in production, but skipping for simplicity here
    return { error: studentError.message };
  }

  await logAudit(context.user.id, "CREATE", "students", userId, null, newStudent);
  revalidatePath("/students");
  return { success: true, id: userId };
}

export async function updateStudent(id: string, formData: FormData) {
  const context = await requirePermission("students.update");
  const collegeId = context.profile.college_id;
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const dob = formData.get("dob") as string || null;
  const gender = formData.get("gender") as string || null;
  const address = formData.get("address") as string || null;
  const department_id = formData.get("department_id") as string || null;
  const course_id = formData.get("course_id") as string || null;
  const semester_id = formData.get("semester_id") as string || null;
  const section_id = formData.get("section_id") as string || null;
  const academic_year_id = formData.get("academic_year_id") as string || null;
  const status = formData.get("status") as string || "ACTIVE";

  const { data: oldData } = await supabase.from("students").select("*").eq("id", id).eq("college_id", collegeId).single();
  if (!oldData) return { error: "Student not found." };

  const newData = {
    dob,
    gender,
    address,
    department_id,
    course_id,
    semester_id,
    section_id,
    academic_year_id,
    status,
    updated_at: new Date().toISOString()
  };

  const { error } = await adminClient.from("students").update(newData).eq("id", id).eq("college_id", collegeId);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "students", id, oldData, newData);
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

export async function deleteStudent(id: string) {
  const context = await requirePermission("students.delete");
  const adminClient = createAdminClient();
  const supabase = await createClient();
  
  const { data: oldData } = await supabase.from("students").select("*").eq("id", id).eq("college_id", context.profile.college_id).single();
  if (!oldData) return { error: "Student not found." };

  // Deleting the auth user will cascade delete the profile and student record
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  await logAudit(context.user.id, "DELETE", "students", id, oldData, null);
  revalidatePath("/students");
  return { success: true };
}

// BULK IMPORT
export async function bulkImportStudents(students: any[]) {
  const context = await requirePermission("students.create");
  const collegeId = context.profile.college_id;
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  const { data: studentRole } = await supabase.from("roles").select("id").eq("name", "STUDENT").single();

  for (const row of students) {
    try {
      if (!row.email || !row.admission_number || !row.first_name) {
        throw new Error(`Missing required fields for row: ${JSON.stringify(row)}`);
      }

      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("college_id", collegeId)
        .eq("admission_number", row.admission_number)
        .single();

      if (existingStudent) {
        throw new Error(`Admission number ${row.admission_number} already exists.`);
      }

      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: row.email,
        password: generateTempPassword(),
        email_confirm: true,
        user_metadata: {
          college_id: collegeId,
          first_name: row.first_name,
          last_name: row.last_name || "",
        }
      });

      if (authError || !authUser.user) throw new Error(authError?.message || "Auth error");

      const userId = authUser.user.id;

      if (studentRole) {
        await adminClient.from("user_roles").insert({
          user_id: userId,
          role_id: studentRole.id,
          college_id: collegeId
        });
      }

      const { error: studentError } = await adminClient.from("students").insert({
        id: userId,
        college_id: collegeId,
        admission_number: row.admission_number,
        dob: row.dob || null,
        gender: row.gender || null,
        admission_date: row.admission_date || null,
        status: "ACTIVE"
      });

      if (studentError) throw new Error(studentError.message);

      results.success++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(e.message);
    }
  }

  await logAudit(context.user.id, "BULK_CREATE", "students", collegeId, null, { success: results.success, failed: results.failed });
  revalidatePath("/students");
  return results;
}

