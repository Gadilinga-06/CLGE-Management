/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// STAFF: CREATE COMPANY
// ─────────────────────────────────────────

export async function createCompany(formData: FormData) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    name: formData.get("name") as string,
    industry: formData.get("industry") as string || null,
    website: formData.get("website") as string || null,
    contact_person: formData.get("contact_person") as string || null,
    contact_email: formData.get("contact_email") as string || null,
    location: formData.get("location") as string || null,
    logo_url: formData.get("logo_url") as string || null,
    description: formData.get("description") as string || null,
  };

  const { data, error } = await supabase.from("companies").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "companies", data.id, null, payload);
  revalidatePath("/placement");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE COMPANY
// ─────────────────────────────────────────

export async function updateCompany(id: string, formData: FormData) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const { data: oldData } = await supabase.from("companies").select("*").eq("id", id).single();
  if (!oldData) return { error: "Company not found." };

  const updates: any = {
    name: formData.get("name") as string,
    industry: formData.get("industry") as string || null,
    website: formData.get("website") as string || null,
    contact_person: formData.get("contact_person") as string || null,
    contact_email: formData.get("contact_email") as string || null,
    location: formData.get("location") as string || null,
    logo_url: formData.get("logo_url") as string || null,
    description: formData.get("description") as string || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("companies").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "companies", id, oldData, updates);
  revalidatePath("/placement");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: CREATE JOB POST
// ─────────────────────────────────────────

export async function createJobPost(formData: FormData) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    company_id: formData.get("company_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    requirements: formData.get("requirements") as string || null,
    ctc_details: formData.get("ctc_details") as string || null,
    eligibility: formData.get("eligibility") as string || null,
    skills: formData.get("skills") as string || null,
    package_amount: formData.get("package_amount") ? parseFloat(formData.get("package_amount") as string) : null,
    location: formData.get("location") as string || null,
    deadline: formData.get("deadline") as string || null,
    max_applicants: formData.get("max_applicants") ? parseInt(formData.get("max_applicants") as string) : null,
    status: "OPEN",
  };

  const { data, error } = await supabase.from("job_posts").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "job_posts", data.id, null, payload);
  revalidatePath("/placement");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE JOB POST
// ─────────────────────────────────────────

export async function updateJobPost(id: string, formData: FormData) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const { data: oldData } = await supabase.from("job_posts").select("*").eq("id", id).single();
  if (!oldData) return { error: "Job post not found." };

  const updates: any = {
    company_id: formData.get("company_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    requirements: formData.get("requirements") as string || null,
    ctc_details: formData.get("ctc_details") as string || null,
    eligibility: formData.get("eligibility") as string || null,
    skills: formData.get("skills") as string || null,
    package_amount: formData.get("package_amount") ? parseFloat(formData.get("package_amount") as string) : null,
    location: formData.get("location") as string || null,
    deadline: formData.get("deadline") as string || null,
    max_applicants: formData.get("max_applicants") ? parseInt(formData.get("max_applicants") as string) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("job_posts").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "job_posts", id, oldData, updates);
  revalidatePath("/placement");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: CLOSE JOB POST
// ─────────────────────────────────────────

export async function closeJobPost(id: string) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const { data: oldData } = await supabase.from("job_posts").select("*").eq("id", id).single();
  if (!oldData) return { error: "Job post not found." };

  const { error } = await supabase.from("job_posts").update({ status: "CLOSED", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "job_posts", id, oldData, { status: "CLOSED" });
  revalidatePath("/placement");
  revalidatePath("/my-jobs");
  return { success: true };
}

// ─────────────────────────────────────────
// STUDENT: APPLY TO JOB
// ─────────────────────────────────────────

export async function applyToJob(jobPostId: string, studentId: string, resumeUrl: string) {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  // Check student owns the studentId
  const { data: student } = await supabase
    .from("students")
    .select("id, college_id")
    .eq("id", studentId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!student) return { error: "Invalid student profile." };

  // Check job post exists and is OPEN
  const { data: jobPost } = await supabase
    .from("job_posts")
    .select("id, status, max_applicants, college_id")
    .eq("id", jobPostId)
    .maybeSingle();

  if (!jobPost) return { error: "Job post not found." };
  if ((jobPost as any).status !== "OPEN") return { error: "This job is no longer accepting applications." };
  if ((jobPost as any).college_id !== (student as any).college_id) return { error: "You are not eligible for this position." };

  // Check not already applied
  const { data: existing } = await supabase
    .from("placement_applications")
    .select("id")
    .eq("job_post_id", jobPostId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) return { error: "You have already applied to this job." };

  // Check max_applicants not exceeded
  if ((jobPost as any).max_applicants) {
    const { count } = await supabase
      .from("placement_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_post_id", jobPostId);

    if (count && count >= (jobPost as any).max_applicants) {
      return { error: "Maximum number of applicants reached." };
    }
  }

  const payload = {
    job_post_id: jobPostId,
    student_id: studentId,
    resume_url: resumeUrl || null,
    status: "APPLIED",
  };

  const { error } = await supabase.from("placement_applications").insert(payload);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "placement_applications", jobPostId, null, payload);
  revalidatePath("/my-jobs");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE APPLICATION STATUS
// ─────────────────────────────────────────

export async function updateApplicationStatus(id: string, status: string, notes?: string, offeredCtc?: number) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const { data: oldData } = await supabase.from("placement_applications").select("*").eq("id", id).single();
  if (!oldData) return { error: "Application not found." };

  const updates: any = {
    status,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("placement_applications").update(updates).eq("id", id);
  if (error) return { error: error.message };

  // If status is SELECTED, also insert into placement_results
  if (status === "SELECTED") {
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("package_amount")
      .eq("id", (oldData as any).job_post_id)
      .maybeSingle();

    const resultPayload = {
      application_id: id,
      offered_ctc: offeredCtc || (jobPost as any)?.package_amount || null,
      offer_date: new Date().toISOString().split("T")[0],
      status: "PENDING",
      notes: notes || null,
    };

    const { error: resultError } = await supabase.from("placement_results").insert(resultPayload);
    if (resultError) return { error: resultError.message };
  }

  await logAudit(ctx.user.id, "UPDATE", "placement_applications", id, oldData, updates);
  revalidatePath("/placement");
  revalidatePath("/my-jobs");
  return { success: true };
}

// ─────────────────────────────────────────
// STAFF: UPDATE APPLICATION PIPELINE
// ─────────────────────────────────────────

export async function updateApplicationPipeline(id: string, status: string) {
  const ctx = await requirePermission("placements.manage");
  const supabase = createAdminClient();

  const { data: oldData } = await supabase.from("placement_applications").select("*").eq("id", id).single();
  if (!oldData) return { error: "Application not found." };

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("placement_applications").update(updates).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "placement_applications", id, oldData, updates);
  revalidatePath("/placement");
  revalidatePath("/my-jobs");
  return { success: true };
}
