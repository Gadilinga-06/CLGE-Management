/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

const VALID_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ─────────────────────────────────────────
// USER: CREATE SUPPORT TICKET
// ─────────────────────────────────────────

export async function createSupportTicket(formData: FormData) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  const priority = formData.get("priority") as string || "MEDIUM";
  if (!VALID_TICKET_PRIORITIES.includes(priority)) {
    return { error: "Invalid priority value" };
  }

  const payload = {
    requester_id: ctx.user.id,
    issue_type: formData.get("issue_type") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    priority,
    category: formData.get("category") as string || null,
    status: "OPEN",
    college_id: ctx.profile.college_id,
  };

  const { data, error } = await supabase.from("support_tickets").insert(payload).select().single();
  if (error) return { error: "Failed to create support ticket" };

  await supabase.from("ticket_activity").insert({
    ticket_id: data.id,
    user_id: ctx.user.id,
    action: "CREATED",
    message: "Ticket created.",
  });

  await logAudit(ctx.user.id, "CREATE", "support_tickets", data.id, null, payload);
  revalidatePath("/help-desk");
  revalidatePath("/my-tickets");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE TICKET
// ─────────────────────────────────────────

export async function updateSupportTicket(id: string, status: string, assignedTo?: string, resolutionNote?: string) {
  const ctx = await requirePermission("helpdesk.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!VALID_TICKET_STATUSES.includes(status)) {
    return { error: "Invalid status value" };
  }

  // Verify ticket belongs to user's college
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, college_id")
    .eq("id", id)
    .eq("college_id", collegeId)
    .single();

  if (!ticket) return { error: "Ticket not found" };

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (assignedTo !== undefined) updates.assigned_to = assignedTo || null;
  if (resolutionNote !== undefined) updates.resolution_note = resolutionNote;

  const { error } = await supabase.from("support_tickets").update(updates).eq("id", id).eq("college_id", collegeId);
  if (error) return { error: "Failed to update ticket" };

  await supabase.from("ticket_activity").insert({
    ticket_id: id,
    user_id: ctx.user.id,
    action: `STATUS_${status}`,
    message: resolutionNote || `Status changed to ${status}.`,
  });

  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select("requester_id, title, ticket_number")
    .eq("id", id)
    .single();

  if (ticketData && (ticketData as any).requester_id) {
    await supabase.from("notifications").insert({
      user_id: (ticketData as any).requester_id,
      title: "Ticket Updated",
      message: `Your ticket #${(ticketData as any).ticket_number || id.slice(0, 8)} "${(ticketData as any).title}" status changed to ${status}.${resolutionNote ? ` Note: ${resolutionNote}` : ""}`,
      type: status === "RESOLVED" ? "SUCCESS" : "INFO",
      category: "SUPPORT",
      link: "/my-tickets",
    });
  }

  await logAudit(ctx.user.id, "UPDATE", "support_tickets", id, null, updates);
  revalidatePath("/help-desk");
  revalidatePath("/my-tickets");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: ADD TICKET ACTIVITY
// ─────────────────────────────────────────

export async function addTicketActivity(ticketId: string, action: string, message: string) {
  const ctx = await requirePermission("helpdesk.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  // Verify ticket belongs to user's college
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("college_id", collegeId)
    .single();

  if (!ticket) return { error: "Ticket not found" };

  const { error } = await supabase.from("ticket_activity").insert({
    ticket_id: ticketId,
    user_id: ctx.user.id,
    action,
    message,
  });

  if (error) return { error: "Failed to add activity" };
  revalidatePath("/help-desk");
  revalidatePath("/my-tickets");
  return { success: true };
}
