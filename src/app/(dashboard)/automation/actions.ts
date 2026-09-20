/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  checkAttendanceShortage,
  checkFeeDueReminders,
  checkAssignmentDeadlines,
  checkExamNotifications,
  runAllAutomations,
} from "@/services/automation";
import { revalidatePath } from "next/cache";

export async function runAttendanceShortageCheck() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Unauthorized" };
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return { error: "Forbidden" };
  }
  return checkAttendanceShortage(ctx.profile.college_id, 75);
}

export async function runFeeDueReminders() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Unauthorized" };
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return { error: "Forbidden" };
  }
  return checkFeeDueReminders(ctx.profile.college_id);
}

export async function runAssignmentDeadlineReminders() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Unauthorized" };
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return { error: "Forbidden" };
  }
  return checkAssignmentDeadlines(ctx.profile.college_id);
}

export async function runExamNotifications() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Unauthorized" };
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return { error: "Forbidden" };
  }
  return checkExamNotifications(ctx.profile.college_id);
}

export async function runAllAutomationsAction() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Unauthorized" };
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return { error: "Forbidden" };
  }
  return runAllAutomations(ctx.profile.college_id);
}

export async function getRecentAutomationLogs() {
  const ctx = await getAuthorizationContext();
  if (!ctx) return [];
  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("automation_logs")
    .select("*")
    .eq("college_id", ctx.profile.college_id)
    .order("started_at", { ascending: false })
    .limit(20);

  return data || [];
}
