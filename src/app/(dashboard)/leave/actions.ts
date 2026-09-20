/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// STUDENT / FACULTY: SUBMIT LEAVE REQUEST
// ─────────────────────────────────────────

export async function submitLeaveRequest(formData: FormData) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;

  if (new Date(endDate) < new Date(startDate)) {
    return { error: "End date must be after start date." };
  }

  // Get the user's student or faculty record for college_id
  const { data: student } = await supabase
    .from("students")
    .select("id, college_id")
    .eq("user_id", ctx.user.id)
    .single();

  let collegeId = student?.college_id || null;

  if (!collegeId) {
    const { data: faculty } = await supabase
      .from("faculty")
      .select("college_id")
      .eq("user_id", ctx.user.id)
      .single();
    collegeId = faculty?.college_id || null;
  }

  const payload = {
    requester_id: ctx.user.id,
    start_date: startDate,
    end_date: endDate,
    reason: formData.get("reason") as string,
    status: "PENDING",
    college_id: collegeId,
  };

  const { data, error } = await supabase.from("leave_requests").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "leave_requests", data.id, null, payload);

  revalidatePath("/leave");
  revalidatePath("/my-leave");
  return { success: true };
}

// ─────────────────────────────────────────
// STUDENT / FACULTY: CANCEL LEAVE REQUEST
// ─────────────────────────────────────────

export async function cancelLeaveRequest(id: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  // Only cancel if PENDING and owned by requester
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id, status, requester_id")
    .eq("id", id)
    .single();

  if (!existing) return { error: "Leave request not found." };
  if ((existing as any).requester_id !== ctx.user.id) return { error: "Not authorized." };
  if ((existing as any).status !== "PENDING") return { error: "Only pending requests can be cancelled." };

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "leave_requests", id, { status: "PENDING" }, { status: "CANCELLED" });

  revalidatePath("/leave");
  revalidatePath("/my-leave");
  return { success: true };
}

// ─────────────────────────────────────────
// APPROVER: APPROVE / REJECT
// ─────────────────────────────────────────

export async function approveLeaveRequest(id: string) {
  const ctx = await requirePermission("leave.approve");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "APPROVED",
      approved_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "leave_requests", id, { status: "PENDING" }, { status: "APPROVED" });

  // Notify requester
  const { data: lr } = await supabase
    .from("leave_requests")
    .select("requester_id, start_date, end_date")
    .eq("id", id)
    .single();

  if (lr) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", (lr as any).requester_id)
      .single();

    await supabase.from("notifications").insert({
      user_id: (lr as any).requester_id,
      title: "Leave Approved",
      message: `Your leave request for ${(lr as any).start_date} to ${(lr as any).end_date} has been approved.`,
      type: "INFO",
      category: "LEAVE",
      link: "/my-leave",
    });
  }

  revalidatePath("/leave");
  revalidatePath("/my-leave");
  return { success: true };
}

export async function rejectLeaveRequest(id: string, reason: string) {
  const ctx = await requirePermission("leave.reject");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "REJECTED",
      rejection_reason: reason || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "leave_requests", id, { status: "PENDING" }, { status: "REJECTED", rejection_reason: reason });

  // Notify requester
  const { data: lr } = await supabase
    .from("leave_requests")
    .select("requester_id, start_date, end_date")
    .eq("id", id)
    .single();

  if (lr) {
    await supabase.from("notifications").insert({
      user_id: (lr as any).requester_id,
      title: "Leave Rejected",
      message: `Your leave request for ${(lr as any).start_date} to ${(lr as any).end_date} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      type: "ALERT",
      category: "LEAVE",
      link: "/my-leave",
    });
  }

  revalidatePath("/leave");
  revalidatePath("/my-leave");
  return { success: true };
}
