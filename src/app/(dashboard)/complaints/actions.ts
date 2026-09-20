/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// USER: CREATE COMPLAINT
// ─────────────────────────────────────────

export async function createComplaint(formData: FormData) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };
  const supabase = createAdminClient();

  // Get college_id from user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("college_id")
    .eq("id", ctx.user.id)
    .single();

  const payload = {
    requester_id: ctx.user.id,
    category: formData.get("category") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    priority: formData.get("priority") as string || "MEDIUM",
    attachment_url: formData.get("attachment_url") as string || null,
    status: "OPEN",
    college_id: (profile as any)?.college_id || null,
  };

  const { data, error } = await supabase.from("complaints").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "complaints", data.id, null, payload);
  revalidatePath("/complaints");
  revalidatePath("/my-complaints");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE COMPLAINT STATUS
// ─────────────────────────────────────────

export async function updateComplaintStatus(id: string, status: string, assignedTo?: string, resolutionNote?: string) {
  const ctx = await requirePermission("complaints.manage");
  const supabase = createAdminClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (assignedTo !== undefined) updates.assigned_to = assignedTo || null;
  if (resolutionNote !== undefined) updates.resolution_note = resolutionNote;

  const { error } = await supabase.from("complaints").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "complaints", id, null, updates);

  // Notify requester on status change
  const { data: complaint } = await supabase
    .from("complaints")
    .select("requester_id, title")
    .eq("id", id)
    .single();

  if (complaint && (complaint as any).requester_id) {
    await supabase.from("notifications").insert({
      user_id: (complaint as any).requester_id,
      title: "Complaint Updated",
      message: `Your complaint "${(complaint as any).title}" status changed to ${status}.${resolutionNote ? ` Note: ${resolutionNote}` : ""}`,
      type: status === "RESOLVED" ? "SUCCESS" : "INFO",
      category: "COMPLAINT",
      link: "/my-complaints",
    });
  }

  revalidatePath("/complaints");
  revalidatePath("/my-complaints");
  return { success: true };
}
