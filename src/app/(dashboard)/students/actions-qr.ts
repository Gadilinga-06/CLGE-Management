/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { generateStudentVerificationToken, verifyStudentToken } from "@/lib/qr";
import { revalidatePath } from "next/cache";

/**
 * Generate a secure verification token for a student.
 * This replaces the raw JSON QR code with an HMAC-signed token.
 */
export async function generateStudentQR(studentId: string) {
  const ctx = await requirePermission("students.view");
  const supabase = await createClient();

  // Verify student exists and belongs to the same college
  const { data: student } = await supabase
    .from("students")
    .select("id, college_id")
    .eq("id", studentId)
    .eq("college_id", ctx.profile.college_id)
    .single();

  if (!student) return { error: "Student not found" };

  const token = generateStudentVerificationToken(student.id, student.college_id);

  // Store token reference
  try {
    await supabase.from("student_verification_tokens").insert({
      student_id: studentId,
      college_id: student.college_id,
      token,
    });
  } catch { /* non-blocking */ }

  return { success: true, token };
}

/**
 * Public endpoint to verify a student QR token.
 * Does not require authentication.
 */
export async function verifyStudentQR(token: string) {
  return verifyStudentToken(token);
}
