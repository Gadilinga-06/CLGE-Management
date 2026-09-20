/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// STAFF: CREATE CERTIFICATE
// ─────────────────────────────────────────

export async function createCertificate(formData: FormData) {
  const ctx = await requirePermission("certificates.create");
  const supabase = createAdminClient();

  const studentId = formData.get("student_id") as string;
  const certificateType = formData.get("certificate_type") as string;

  // Get student info
  const { data: student } = await supabase
    .from("students")
    .select("id, college_id, admission_number, profiles(first_name, last_name)")
    .eq("id", studentId)
    .single();

  if (!student) return { error: "Student not found." };

  // Generate unique certificate ID
  const certPrefix = certificateType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const certificateId = `CERT-${certPrefix}-${timestamp}-${random}`;

  const payload = {
    student_id: studentId,
    certificate_id: certificateId,
    certificate_type: certificateType,
    issue_date: (formData.get("issue_date") as string) || new Date().toISOString().split("T")[0],
    issuer_id: ctx.user.id,
    verification_status: "VERIFIED",
    college_id: (student as any).college_id,
    template_type: formData.get("template_type") as string || certificateType,
    student_name: `${(student as any).profiles?.first_name} ${(student as any).profiles?.last_name}`,
    course_name: formData.get("course_name") as string || null,
    valid_until: formData.get("valid_until") as string || null,
    metadata: JSON.stringify({
      admission_number: (student as any).admission_number,
      issuer_name: ctx.profile.first_name + " " + ctx.profile.last_name,
    }),
  };

  const { data, error } = await supabase.from("certificates").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "certificates", data.id, null, payload);
  revalidatePath("/certificates");
  revalidatePath("/my-certificates");
  return { success: true, certificateId };
}

// ─────────────────────────────────────────
// PUBLIC: VERIFY CERTIFICATE
// ─────────────────────────────────────────

export async function verifyCertificate(certificateId: string) {
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("certificate_id, certificate_type, issue_date, valid_until, verification_status, student_name, course_name")
    .eq("certificate_id", certificateId)
    .maybeSingle();

  if (!cert) return { verified: false, error: "Certificate not found." };

  return {
    verified: (cert as any).verification_status === "VERIFIED",
    certificate: {
      certificateId: (cert as any).certificate_id,
      type: (cert as any).certificate_type,
      issueDate: (cert as any).issue_date,
      validUntil: (cert as any).valid_until,
      studentName: (cert as any).student_name,
      courseName: (cert as any).course_name,
      status: (cert as any).verification_status,
    },
  };
}

// ─────────────────────────────────────────
// STAFF: REVOKE CERTIFICATE
// ─────────────────────────────────────────

export async function revokeCertificate(id: string) {
  const ctx = await requirePermission("certificates.create");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("certificates")
    .update({ verification_status: "REVOKED", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "certificates", id, { verification_status: "VERIFIED" }, { verification_status: "REVOKED" });
  revalidatePath("/certificates");
  return { success: true };
}
