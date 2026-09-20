import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

interface StudentRecord {
  admission_number: string;
  status: string;
  profiles?: { first_name: string; last_name: string } | null;
  departments?: { name: string } | null;
}

interface TokenPayload {
  sid: string;
  cid: string;
  t: number;
  h: string;
}

function getHmacSecret(): string {
  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) {
    throw new Error("QR_HMAC_SECRET environment variable is required");
  }
  return secret;
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Generate an HMAC-signed student verification token.
 * The token contains student ID, college ID, timestamp, and HMAC signature.
 */
export function generateStudentVerificationToken(studentId: string, collegeId: string): string {
  const timestamp = Date.now();
  const payload = `${studentId}:${collegeId}:${timestamp}`;
  const secret = getHmacSecret();
  const signature = signPayload(payload, secret);

  const encoded = btoa(JSON.stringify({ sid: studentId, cid: collegeId, t: timestamp, h: signature }));
  return encoded.replace(/[=+/]/g, (c) => {
    if (c === "=") return "";
    if (c === "+") return "-";
    if (c === "/") return "_";
    return c;
  });
}

/**
 * Verify a student verification token and return the student details.
 * Does NOT expose sensitive data - only public-safe information.
 */
export async function verifyStudentToken(token: string): Promise<{
  verified: boolean;
  student?: { name: string; admissionNumber: string; department: string; status: string };
  error?: string;
}> {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const decoded: TokenPayload = JSON.parse(atob(normalized + padding));

    const { sid: studentId, cid: collegeId, t: timestamp, h: signature } = decoded;

    if (!studentId || !collegeId || !timestamp || !signature) {
      return { verified: false, error: "Invalid token structure" };
    }

    const tokenAge = Date.now() - timestamp;
    if (tokenAge > 365 * 24 * 60 * 60 * 1000) {
      return { verified: false, error: "Token expired" };
    }

    // Verify HMAC signature
    const secret = getHmacSecret();
    const payload = `${studentId}:${collegeId}:${timestamp}`;
    const expectedSignature = signPayload(payload, secret);

    if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return { verified: false, error: "Invalid token signature" };
    }

    // Fetch the specific student (not all students)
    const supabase = await createClient();
    const { data: student } = await supabase
      .from("students")
      .select("id, admission_number, status, profiles(first_name, last_name), departments(name)")
      .eq("id", studentId)
      .eq("college_id", collegeId)
      .single();

    if (!student) {
      return { verified: false, error: "Student not found" };
    }

    const s = student as unknown as StudentRecord;

    // Log verification attempt
    try {
      await supabase.from("audit_logs").insert({
        college_id: collegeId,
        user_id: null,
        action: "VERIFY",
        entity: "student_qr",
        entity_id: studentId,
        new_data: { verified_at: new Date().toISOString() },
      });
    } catch { /* non-blocking */ }

    return {
      verified: true,
      student: {
        name: `${s.profiles?.first_name || ""} ${s.profiles?.last_name || ""}`.trim(),
        admissionNumber: s.admission_number,
        department: s.departments?.name || "",
        status: s.status,
      },
    };
  } catch {
    return { verified: false, error: "Invalid token format" };
  }
}
