/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function createAttendanceSession(formData: FormData) {
  const context = await requirePermission("attendance.create");
  const collegeId = context.profile.college_id;
  
  const assignment_id = formData.get("assignment_id") as string;
  const date = formData.get("date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;

  const supabase = createAdminClient();

  const { data: assignment, error: assignError } = await supabase
    .from("faculty_assignments")
    .select("*")
    .eq("id", assignment_id)
    .eq("college_id", collegeId)
    .single();

  if (assignError || !assignment) return { error: "Invalid assignment selected" };

  const newSession = {
    college_id: collegeId,
    faculty_id: context.user.id,
    subject_id: assignment.subject_id,
    section_id: assignment.section_id,
    semester_id: assignment.semester_id,
    academic_year_id: assignment.academic_year_id,
    date,
    start_time,
    end_time
  };

  const { data, error } = await supabase.from("attendance_sessions").insert(newSession).select().single();
  
  if (error) {
    if (error.code === '23505') {
      return { error: "A session already exists for this section, subject, and time." };
    }
    return { error: error.message };
  }

  await logAudit(context.user.id, "CREATE", "attendance_sessions", data.id, null, newSession);
  revalidatePath("/attendance");
  return { success: true, sessionId: data.id };
}

export async function saveBulkAttendance(sessionId: string, records: any[]) {
  const context = await requirePermission("attendance.update");
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("college_id", context.profile.college_id)
    .single();

  if (!session) return { error: "Session not found." };

  const recordsToUpsert = records.map(r => ({
    session_id: sessionId,
    student_id: r.student_id,
    college_id: context.profile.college_id,
    status: r.status,
    recorded_via: 'MANUAL',
    recorded_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from("attendance_records")
    .upsert(recordsToUpsert, { onConflict: "session_id,student_id" });

  if (error) return { error: error.message };

  await logAudit(context.user.id, "UPDATE", "attendance_records", sessionId, null, { bulk_update: true, count: records.length });
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${sessionId}`);
  return { success: true };
}

export async function generateQRToken(sessionId: string) {
  const context = await requirePermission("attendance.update");
  const supabase = createAdminClient();

  // 30 seconds expiration
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

  const { error } = await supabase
    .from("attendance_sessions")
    .update({ qr_token: token, qr_expires_at: expiresAt })
    .eq("id", sessionId)
    .eq("college_id", context.profile.college_id);

  if (error) return { error: error.message };

  // Audit log for token generation
  try {
    await supabase.from("attendance_audit_log").insert({
      session_id: sessionId,
      student_id: context.user.id,
      action: "QR_GENERATE",
      token_used: token,
      success: true,
    });
  } catch { /* non-blocking */ }

  return { success: true, token, expiresAt };
}

export async function markAttendanceViaQR(sessionId: string, token: string) {
  const context = await requirePermission("attendance.create");
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("qr_token, qr_expires_at, college_id, used_tokens")
    .eq("id", sessionId)
    .single();

  // Log the attempt regardless of outcome
  const logAttempt = async (success: boolean, errorMsg?: string) => {
    try {
      await supabase.from("attendance_audit_log").insert({
        session_id: sessionId,
        student_id: context.user.id,
        action: "QR_SCAN",
        token_used: token,
        success,
        error_message: errorMsg || null,
      });
    } catch { /* non-blocking */ }
  };

  if (!session) {
    await logAttempt(false, "Session not found");
    return { error: "Session not found" };
  }

  if (session.qr_token !== token) {
    await logAttempt(false, "Invalid token");
    return { error: "Invalid or expired QR code" };
  }

  if (new Date(session.qr_expires_at) < new Date()) {
    await logAttempt(false, "Token expired");
    return { error: "QR code has expired" };
  }

  // Replay prevention: check if token was already used
  const usedTokens: string[] = session.used_tokens || [];
  if (usedTokens.includes(token)) {
    await logAttempt(false, "Token already used (replay)");
    return { error: "QR code has already been used" };
  }

  // Ensure user is a student
  if (!context.roles.includes("STUDENT")) {
    await logAttempt(false, "Not a student");
    return { error: "Only students can mark attendance via QR" };
  }

  // Check duplicate: student already marked for this session
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", context.user.id)
    .single();

  if (existingRecord) {
    await logAttempt(false, "Already marked");
    return { error: "Attendance already recorded for this session" };
  }

  // Mark attendance
  const { error } = await supabase
    .from("attendance_records")
    .insert({
      session_id: sessionId,
      student_id: context.user.id,
      college_id: session.college_id,
      status: 'PRESENT',
      recorded_via: 'QR',
      recorded_at: new Date().toISOString()
    });

  if (error) {
    await logAttempt(false, error.message);
    return { error: error.message };
  }

  // Mark token as used for replay prevention
  await supabase
    .from("attendance_sessions")
    .update({ used_tokens: [...usedTokens, token] })
    .eq("id", sessionId);

  await logAttempt(true);

  return { success: true };
}
