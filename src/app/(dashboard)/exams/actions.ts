/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ---------------- EXAMS ----------------

export async function createExam(formData: FormData) {
  const context = await requirePermission("exams.create");
  const supabase = createAdminClient();

  const newExam = {
    college_id: context.profile.college_id,
    academic_year_id: formData.get("academic_year_id") as string,
    semester_id: formData.get("semester_id") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
  };

  const { data, error } = await supabase.from("exams").insert(newExam).select().single();
  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "exams", data.id, null, newExam);
  revalidatePath("/exams");
  return { success: true };
}

export async function addExamSubject(formData: FormData) {
  const context = await requirePermission("exams.create");
  const supabase = createAdminClient();

  const newSubject = {
    exam_id: formData.get("exam_id") as string,
    subject_id: formData.get("subject_id") as string,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    max_marks: parseFloat(formData.get("max_marks") as string),
    min_pass_marks: parseFloat(formData.get("min_pass_marks") as string),
  };

  const { data, error } = await supabase.from("exam_subjects").insert(newSubject).select().single();
  if (error) return { error: error.message };

  await logAudit(context.user.id, "CREATE", "exam_subjects", data.id, null, newSubject);
  revalidatePath("/exams");
  return { success: true };
}

// ---------------- MARKS ----------------

export async function saveStudentMark(payload: any) {
  const context = await requirePermission("marks.create");
  const supabase = createAdminClient();
  
  // Faculty only! (Unless Admin)
  if (!context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    if (!context.roles.includes("FACULTY")) {
      return { error: "Only authorized faculty can enter marks." };
    }
  }

  // Validate Max Marks
  const { data: examSubject } = await supabase
    .from("exam_subjects")
    .select("max_marks")
    .eq("exam_id", payload.exam_id)
    .eq("subject_id", payload.subject_id)
    .single();

  if (!examSubject) return { error: "Exam subject configuration not found." };
  
  if (payload.marks_obtained > examSubject.max_marks) {
    return { error: `Marks cannot exceed the maximum allowed (${examSubject.max_marks})` };
  }
  if (payload.marks_obtained < 0) {
    return { error: `Marks cannot be negative` };
  }

  const markData = {
    exam_id: payload.exam_id,
    subject_id: payload.subject_id,
    student_id: payload.student_id,
    faculty_id: context.user.id,
    college_id: context.profile.college_id,
    marks_obtained: payload.marks_obtained,
    status: payload.status || 'DRAFT'
  };

  const { data, error } = await supabase
    .from("exam_marks")
    .upsert(markData, { onConflict: "exam_id,student_id,subject_id" })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marks");
  return { success: true, data };
}

export async function publishMarks(examId: string, subjectId: string) {
  const context = await requirePermission("marks.publish");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("exam_marks")
    .update({ status: 'PUBLISHED' })
    .eq("exam_id", examId)
    .eq("subject_id", subjectId)
    .eq("college_id", context.profile.college_id);

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "exam_marks", examId, null, { action: "PUBLISHED_MARKS", subject_id: subjectId });
  revalidatePath("/results");
  return { success: true };
}

// ---------------- GRADING ----------------

export async function addGradingRule(formData: FormData) {
  const context = await requirePermission("settings.update");
  const supabase = createAdminClient();

  const rule = {
    college_id: context.profile.college_id,
    grade: formData.get("grade") as string,
    grade_point: parseFloat(formData.get("grade_point") as string),
    min_percentage: parseFloat(formData.get("min_percentage") as string),
    max_percentage: parseFloat(formData.get("max_percentage") as string),
  };

  const { error } = await supabase.from("grading_rules").insert(rule);
  if (error) return { error: error.message };
  
  revalidatePath("/settings/grading");
  return { success: true };
}

export async function deleteGradingRule(id: string) {
  const context = await requirePermission("settings.update");
  const supabase = createAdminClient();
  const { error } = await supabase.from("grading_rules").delete().eq("id", id).eq("college_id", context.profile.college_id);
  if (error) return { error: error.message };
  revalidatePath("/settings/grading");
  return { success: true };
}
