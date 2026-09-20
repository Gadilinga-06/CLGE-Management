/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Automation Engine
 *
 * Provides scheduled automation triggers for common college management tasks:
 * - Attendance shortage alerts
 * - Fee due reminders
 * - Assignment deadline reminders
 * - Exam notifications
 *
 * Each automation function:
 * 1. Queries the database for conditions that trigger the alert
 * 2. Sends in-app notifications to affected users
 * 3. Logs the automation action for audit
 * 4. Returns results for monitoring
 *
 * SECURITY: All functions accept a collegeId parameter to scope queries
 * to a specific college, preventing cross-college data leaks.
 */

import { createClient } from "@/lib/supabase/server";
import { sendBulkNotification } from "./notification";

// ─── Types ────────────────────────────────────────────────

export interface AutomationResult {
  triggered: boolean;
  type: string;
  count: number;
  message: string;
}

// ─── Attendance Shortage Alerts ───────────────────────────

/**
 * Check students for attendance below threshold and send shortage alerts.
 * Scoped to a specific college.
 */
export async function checkAttendanceShortage(
  collegeId: string,
  thresholdPercent: number = 75
): Promise<AutomationResult> {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, user_id, admission_number, profiles(first_name, last_name, email)")
    .eq("college_id", collegeId)
    .eq("status", "ACTIVE");

  if (!students || students.length === 0) {
    return { triggered: false, type: "ATTENDANCE_SHORTAGE", count: 0, message: "No active students" };
  }

  const studentIds = students.map((s) => s.id);

  const { data: records } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .in("student_id", studentIds)
    .eq("college_id", collegeId);

  if (!records || records.length === 0) {
    return { triggered: false, type: "ATTENDANCE_SHORTAGE", count: 0, message: "No attendance records" };
  }

  const attendanceMap: Record<string, { total: number; present: number }> = {};
  records.forEach((r) => {
    if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = { total: 0, present: 0 };
    attendanceMap[r.student_id].total++;
    if (r.status === "PRESENT" || r.status === "LATE") {
      attendanceMap[r.student_id].present++;
    }
  });

  const shortageStudents = students.filter((s) => {
    const att = attendanceMap[s.id];
    if (!att || att.total === 0) return false;
    const pct = (att.present / att.total) * 100;
    return pct < thresholdPercent;
  });

  if (shortageStudents.length === 0) {
    return { triggered: false, type: "ATTENDANCE_SHORTAGE", count: 0, message: "No shortage students" };
  }

  const userIds = shortageStudents
    .map((s) => s.user_id)
    .filter(Boolean);

  if (userIds.length > 0) {
    await sendBulkNotification(userIds, {
      title: "Attendance Shortage Alert",
      message: `Your attendance is below ${thresholdPercent}%. Please attend classes regularly to avoid academic penalties.`,
      category: "ATTENDANCE",
      link: "/attendance",
      channels: ["inapp"],
    });
  }

  try {
    await supabase.from("audit_logs").insert({
      college_id: collegeId,
      user_id: null,
      action: "AUTOMATION",
      entity: "attendance_shortage_check",
      entity_id: "batch",
      new_data: {
        threshold: thresholdPercent,
        shortage_count: shortageStudents.length,
        checked_at: new Date().toISOString(),
      },
    });
  } catch { /* non-blocking */ }

  return {
    triggered: true,
    type: "ATTENDANCE_SHORTAGE",
    count: shortageStudents.length,
    message: `${shortageStudents.length} students below ${thresholdPercent}% attendance`,
  };
}

// ─── Fee Due Reminders ───────────────────────────────────

/**
 * Check for overdue fees and send payment reminders.
 * Scoped to a specific college.
 */
export async function checkFeeDueReminders(collegeId: string): Promise<AutomationResult> {
  const supabase = await createClient();

  const { data: overdueFees } = await supabase
    .from("student_fees")
    .select(`
      id, amount_due, paid_amount, status,
      students(id, user_id, admission_number, profiles(first_name, last_name)),
      fee_structures(category, academic_years(name))
    `)
    .eq("college_id", collegeId)
    .in("status", ["OVERDUE", "PENDING", "PARTIAL"]);

  if (!overdueFees || overdueFees.length === 0) {
    return { triggered: false, type: "FEE_DUE_REMINDER", count: 0, message: "No overdue fees" };
  }

  const studentFees: Record<string, { userId: string; total: number; categories: string[] }> = {};
  overdueFees.forEach((f: any) => {
    const studentId = f.students?.id;
    const userId = f.students?.user_id;
    if (!studentId || !userId) return;

    const effective = (f.amount_due || 0) - (f.paid_amount || 0);
    if (effective <= 0) return;

    if (!studentFees[studentId]) {
      studentFees[studentId] = { userId, total: 0, categories: [] };
    }
    studentFees[studentId].total += effective;
    const cat = f.fee_structures?.category || "Fee";
    if (!studentFees[studentId].categories.includes(cat)) {
      studentFees[studentId].categories.push(cat);
    }
  });

  const userIds = Object.values(studentFees).map((f) => f.userId).filter(Boolean);

  if (userIds.length > 0) {
    await sendBulkNotification(userIds, {
      title: "Fee Payment Reminder",
      message: "You have pending fee payments. Please clear your dues at the earliest.",
      category: "FEE",
      link: "/my-fees",
      channels: ["inapp"],
    });
  }

  try {
    await supabase.from("audit_logs").insert({
      college_id: collegeId,
      user_id: null,
      action: "AUTOMATION",
      entity: "fee_due_reminder",
      entity_id: "batch",
      new_data: {
        students_with_dues: Object.keys(studentFees).length,
        checked_at: new Date().toISOString(),
      },
    });
  } catch { /* non-blocking */ }

  return {
    triggered: true,
    type: "FEE_DUE_REMINDER",
    count: Object.keys(studentFees).length,
    message: `${Object.keys(studentFees).length} students with pending fees`,
  };
}

// ─── Assignment Deadline Reminders ───────────────────────

/**
 * Check for assignments due within the next 24 hours and send reminders.
 * Scoped to a specific college.
 */
export async function checkAssignmentDeadlines(collegeId: string): Promise<AutomationResult> {
  const supabase = await createClient();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: upcomingAssignments } = await supabase
    .from("assignments")
    .select(`
      id, title, due_date, section_id,
      sections(name, semester_id, course_id)
    `)
    .eq("college_id", collegeId)
    .eq("status", "PUBLISHED")
    .gte("due_date", now.toISOString())
    .lte("due_date", tomorrow.toISOString());

  if (!upcomingAssignments || upcomingAssignments.length === 0) {
    return { triggered: false, type: "ASSIGNMENT_DEADLINE", count: 0, message: "No upcoming deadlines" };
  }

  // Batch: collect all unique section IDs
  const sectionIds = [...new Set(upcomingAssignments.map((a) => a.section_id).filter(Boolean))];

  // Batch: fetch all active students in those sections in ONE query
  const { data: allStudents } = await supabase
    .from("students")
    .select("id, user_id, section_id")
    .in("section_id", sectionIds)
    .eq("college_id", collegeId)
    .eq("status", "ACTIVE");

  // Batch: fetch all submissions for those assignments in ONE query
  const assignmentIds = upcomingAssignments.map((a) => a.id);
  const { data: allSubmissions } = await supabase
    .from("assignment_submissions")
    .select("student_id, assignment_id")
    .in("assignment_id", assignmentIds);

  // Build lookup maps
  const studentsBySection = new Map<string, typeof allStudents>();
  (allStudents || []).forEach((s) => {
    const list = studentsBySection.get(s.section_id) || [];
    list.push(s);
    studentsBySection.set(s.section_id, list);
  });

  const submittedSet = new Set(
    (allSubmissions || []).map((s) => `${s.assignment_id}:${s.student_id}`)
  );

  // Process each assignment using the pre-fetched data
  let totalReminders = 0;
  for (const assignment of upcomingAssignments) {
    const studentsInSection = studentsBySection.get(assignment.section_id) || [];
    if (studentsInSection.length === 0) continue;

    const notSubmitted = studentsInSection.filter(
      (s) => !submittedSet.has(`${assignment.id}:${s.id}`)
    );

    const userIds = notSubmitted.map((s) => s.user_id).filter(Boolean);
    if (userIds.length > 0) {
      await sendBulkNotification(userIds, {
        title: "Assignment Due Soon",
        message: `Assignment "${assignment.title}" is due soon. Section: ${(assignment as any).sections?.name || "N/A"}.`,
        category: "ASSIGNMENT",
        link: "/my-assignments",
        channels: ["inapp"],
      });
      totalReminders += userIds.length;
    }
  }

  try {
    await supabase.from("audit_logs").insert({
      college_id: collegeId,
      user_id: null,
      action: "AUTOMATION",
      entity: "assignment_deadline_reminder",
      entity_id: "batch",
      new_data: {
        assignments_checked: upcomingAssignments.length,
        reminders_sent: totalReminders,
        checked_at: new Date().toISOString(),
      },
    });
  } catch { /* non-blocking */ }

  return {
    triggered: true,
    type: "ASSIGNMENT_DEADLINE",
    count: totalReminders,
    message: `${totalReminders} reminders sent for ${upcomingAssignments.length} assignments`,
  };
}

// ─── Exam Notifications ──────────────────────────────────

/**
 * Check for upcoming exams and notify students.
 * Scoped to a specific college.
 */
export async function checkExamNotifications(collegeId: string): Promise<AutomationResult> {
  const supabase = await createClient();

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: upcomingExams } = await supabase
    .from("exams")
    .select(`
      id, name, start_date, end_date, exam_type,
      exam_subjects(subjects(name))
    `)
    .eq("college_id", collegeId)
    .gte("start_date", now.toISOString())
    .lte("start_date", weekLater.toISOString())
    .eq("status", "SCHEDULED");

  if (!upcomingExams || upcomingExams.length === 0) {
    return { triggered: false, type: "EXAM_NOTIFICATION", count: 0, message: "No upcoming exams" };
  }

  const { data: students } = await supabase
    .from("students")
    .select("user_id")
    .eq("college_id", collegeId)
    .eq("status", "ACTIVE");

  const userIds = (students || []).map((s) => s.user_id).filter(Boolean);

  if (userIds.length > 0) {
    const examNames = upcomingExams.map((e) => e.name).join(", ");
    await sendBulkNotification(userIds, {
      title: "Upcoming Exam Alert",
      message: `You have exams starting soon: ${examNames}. Please prepare accordingly.`,
      category: "EXAM",
      link: "/results",
      channels: ["inapp"],
    });
  }

  try {
    await supabase.from("audit_logs").insert({
      college_id: collegeId,
      user_id: null,
      action: "AUTOMATION",
      entity: "exam_notification",
      entity_id: "batch",
      new_data: {
        exams_checked: upcomingExams.length,
        notified_count: userIds.length,
        checked_at: new Date().toISOString(),
      },
    });
  } catch { /* non-blocking */ }

  return {
    triggered: true,
    type: "EXAM_NOTIFICATION",
    count: upcomingExams.length,
    message: `${upcomingExams.length} upcoming exams found, ${userIds.length} students notified`,
  };
}

// ─── Run All Automations ─────────────────────────────────

/**
 * Run all automation checks for a specific college.
 */
export async function runAllAutomations(collegeId: string): Promise<AutomationResult[]> {
  const supabase = await createClient();

  const startTime = Date.now();
  const results = await Promise.allSettled([
    checkAttendanceShortage(collegeId, 75),
    checkFeeDueReminders(collegeId),
    checkAssignmentDeadlines(collegeId),
    checkExamNotifications(collegeId),
  ]);

  const mapped = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const types = ["ATTENDANCE_SHORTAGE", "FEE_DUE_REMINDER", "ASSIGNMENT_DEADLINE", "EXAM_NOTIFICATION"];
    return {
      triggered: false,
      type: types[i] || "UNKNOWN",
      count: 0,
      message: `Error: ${r.reason}`,
    };
  });

  const durationMs = Date.now() - startTime;
  for (const result of mapped) {
    try {
      await supabase.from("automation_logs").insert({
        college_id: collegeId,
        automation_type: result.type,
        triggered: result.triggered,
        count: result.count,
        message: result.message,
        details: JSON.stringify(result),
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      });
    } catch { /* non-blocking */ }
  }

  return mapped;
}
