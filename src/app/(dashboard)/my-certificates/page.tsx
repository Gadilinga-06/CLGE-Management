import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyCertificatesClient } from "./client";

export default async function MyCertificatesPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("STUDENT")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (!student) redirect("/");

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id, student_id, certificate_id, certificate_type, issue_date, issuer_id,
      verification_status, metadata, created_at, college_id, template_type,
      student_name, course_name, valid_until, pdf_url, updated_at
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Certificates</h2>
          <p className="text-muted-foreground">View and download your certificates.</p>
        </div>
      </div>
      <MyCertificatesClient certificates={certificates || []} />
    </div>
  );
}
