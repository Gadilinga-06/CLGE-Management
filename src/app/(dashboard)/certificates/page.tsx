import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CertificatesClient } from "./client";

export default async function CertificatesPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id, student_id, certificate_id, certificate_type, issue_date, issuer_id,
      verification_status, metadata, created_at, college_id, template_type,
      student_name, course_name, valid_until, pdf_url, updated_at,
      students (id, admission_number, user_id, profiles (first_name, last_name, email))
    `)
    .eq("college_id", context.profile.college_id)
    .order("created_at", { ascending: false });

  // Get all students for the create dialog
  const { data: students } = await supabase
    .from("students")
    .select("id, admission_number, user_id, profiles (first_name, last_name)")
    .eq("college_id", context.profile.college_id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
          <p className="text-muted-foreground">Issue and manage student certificates.</p>
        </div>
      </div>
      <CertificatesClient
        certificates={certificates || []}
        students={students || []}
      />
    </div>
  );
}
