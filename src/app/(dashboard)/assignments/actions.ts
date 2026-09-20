/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// FACULTY: CREATE / EDIT / PUBLISH / DELETE
// ─────────────────────────────────────────

export async function createAssignment(formData: FormData) {
  const ctx = await requirePermission("assignments.create");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    faculty_id: formData.get("faculty_id") as string,
    subject_id: formData.get("subject_id") as string,
    section_id: formData.get("section_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    deadline: formData.get("deadline") as string,
    max_marks: parseFloat(formData.get("max_marks") as string) || null,
    allow_late_submission: formData.get("allow_late_submission") === "true",
    status: formData.get("status") as string || "DRAFT",
  };

  const { data, error } = await supabase.from("assignments").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "assignments", data.id, null, payload);
  revalidatePath("/assignments");
  return { success: true };
}

export async function updateAssignment(id: string, formData: FormData) {
  const ctx = await requirePermission("assignments.update");
  const supabase = createAdminClient();

  const updates = {
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    deadline: formData.get("deadline") as string,
    max_marks: parseFloat(formData.get("max_marks") as string) || null,
    allow_late_submission: formData.get("allow_late_submission") === "true",
    status: formData.get("status") as string || "DRAFT",
  };

  const { error } = await supabase.from("assignments").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "assignments", id, null, updates);
  revalidatePath("/assignments");
  return { success: true };
}

export async function publishAssignment(id: string) {
  const ctx = await requirePermission("assignments.update");
  const supabase = createAdminClient();

  const { error } = await supabase.from("assignments").update({ status: "PUBLISHED" }).eq("id", id);
  if (error) return { error: error.message };

  // Notify students in the section
  const { data: assignment } = await supabase
    .from("assignments")
    .select("title, section_id")
    .eq("id", id)
    .single();

  if (assignment) {
    const { data: students } = await supabase
      .from("students")
      .select("user_id")
      .eq("section_id", (assignment as any).section_id)
      .eq("status", "ACTIVE");

    if (students && students.length > 0) {
      const notifications = (students as any[]).map(s => ({
        user_id: s.user_id,
        title: "New Assignment",
        message: `A new assignment "${(assignment as any).title}" has been published.`,
        type: "INFO",
        category: "ASSIGNMENT",
        link: "/my-assignments",
      }));
      await supabase.from("notifications").insert(notifications);
    }
  }

  await logAudit(ctx.user.id, "UPDATE", "assignments", id, { status: "DRAFT" }, { status: "PUBLISHED" });
  revalidatePath("/assignments");
  revalidatePath("/my-assignments");
  return { success: true };
}

export async function deleteAssignment(id: string) {
  const ctx = await requirePermission("assignments.update");
  const supabase = createAdminClient();

  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "assignments", id, null, null);
  revalidatePath("/assignments");
  return { success: true };
}

// ─────────────────────────────────────────
// STUDENT: SUBMIT / REPLACE
// ─────────────────────────────────────────

export async function submitAssignment(payload: { assignment_id: string; submission_url: string }) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .single();

  if (!student) return { error: "Student record not found." };

  // Check assignment exists and is published
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, deadline, status, allow_late_submission, title")
    .eq("id", payload.assignment_id)
    .single();

  if (!assignment) return { error: "Assignment not found." };
  if ((assignment as any).status !== "PUBLISHED") return { error: "Assignment is not published yet." };

  // Check deadline (allow if late submissions enabled)
  const now = new Date();
  const deadline = new Date((assignment as any).deadline);
  if (now > deadline && !(assignment as any).allow_late_submission) {
    return { error: "Submission deadline has passed." };
  }

  // Upsert (replace existing submission)
  const { error } = await supabase
    .from("assignment_submissions")
    .upsert({
      assignment_id: payload.assignment_id,
      student_id: student.id,
      submission_url: payload.submission_url,
      submitted_at: now.toISOString(),
    }, { onConflict: "assignment_id,student_id" });

  if (error) return { error: error.message };

  // Notify faculty
  const { data: a } = await supabase
    .from("assignments")
    .select("faculty_id, faculty!inner(user_id)")
    .eq("id", payload.assignment_id)
    .single();

  if (a && (a as any).faculty?.user_id) {
    const { data: s } = await supabase
      .from("students")
      .select("admission_number")
      .eq("id", student.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: (a as any).faculty.user_id,
      title: "Assignment Submission",
      message: `Student ${(s as any)?.admission_number || "unknown"} submitted "${(assignment as any).title}".`,
      type: "INFO",
      category: "ASSIGNMENT",
      link: "/assignments",
    });
  }

  revalidatePath("/my-assignments");
  return { success: true };
}

// ─────────────────────────────────────────
// FACULTY: GRADE
// ─────────────────────────────────────────

export async function gradeSubmission(submissionId: string, marks: number, feedback: string) {
  const ctx = await requirePermission("assignments.grade");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("assignment_submissions")
    .update({ marks_obtained: marks, feedback })
    .eq("id", submissionId);

  if (error) return { error: error.message };

  // Notify student
  const { data: sub } = await supabase
    .from("assignment_submissions")
    .select("student_id, students(user_id), assignments(title)")
    .eq("id", submissionId)
    .single();

  if (sub && (sub as any).students?.user_id) {
    await supabase.from("notifications").insert({
      user_id: (sub as any).students.user_id,
      title: "Assignment Graded",
      message: `Your submission for "${(sub as any).assignments?.title}" has been graded. Marks: ${marks}`,
      type: "INFO",
      category: "ASSIGNMENT",
      link: "/my-assignments",
    });
  }

  revalidatePath("/assignments");
  return { success: true };
}

// ─────────────────────────────────────────
// NOTICES
// ─────────────────────────────────────────

export async function createNotice(formData: FormData) {
  const ctx = await requirePermission("notices.create");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    category: formData.get("category") as string || "GENERAL",
    department_id: formData.get("department_id") as string || null,
    course_id: formData.get("course_id") as string || null,
    semester_id: formData.get("semester_id") as string || null,
    section_id: formData.get("section_id") as string || null,
    target_role: formData.get("target_role") as string || null,
    created_by: ctx.user.id,
  };

  const { data, error } = await supabase.from("notices").insert(payload).select().single();
  if (error) return { error: error.message };

  // Create notifications for targeted users
  let targetUsers: string[] = [];

  if (!payload.department_id && !payload.course_id && !payload.target_role) {
    // College-wide: notify all users in college
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("college_id", ctx.profile.college_id)
      .eq("is_active", true);
    targetUsers = (profiles || []).map((p: any) => p.id);
  } else if (payload.target_role) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, roles!inner(name)")
      .eq("roles.name", payload.target_role);
    targetUsers = (roles || []).map((r: any) => r.user_id);
  }

  if (targetUsers.length > 0) {
    const notifications = targetUsers.slice(0, 100).map(userId => ({
      user_id: userId,
      title: `New Notice: ${payload.title}`,
      message: payload.content.substring(0, 200),
      type: "ALERT",
      category: "NOTICE",
      link: "/notices",
    }));
    await supabase.from("notifications").insert(notifications);
  }

  await logAudit(ctx.user.id, "CREATE", "notices", data.id, null, payload);
  revalidatePath("/notices");
  return { success: true };
}

export async function deleteNotice(id: string) {
  const ctx = await requirePermission("notices.delete");
  const supabase = createAdminClient();

  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "notices", id, null, null);
  revalidatePath("/notices");
  return { success: true };
}

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────

export async function markNotificationRead(id: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(id: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

// ─────────────────────────────────────────
// NOTIFICATION HELPER (used by other modules)
// ─────────────────────────────────────────

export async function createNotification(userId: string, title: string, message: string, category: string = "SYSTEM", link?: string) {
  const context = await getAuthorizationContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: "INFO",
    category,
    link: link || null,
    college_id: context.profile.college_id,
  });
  if (error) console.error("Failed to create notification:", error.message);
}
