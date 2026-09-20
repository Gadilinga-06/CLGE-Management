/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyJobsClient } from "./client";

export default async function MyJobsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.roles.includes("STUDENT") && !ctx.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id, college_id")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!student) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Jobs</h2>
          <p className="text-muted-foreground">Browse job opportunities and manage your applications.</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No student profile found. Please contact administration.
        </div>
      </div>
    );
  }

  // Query open job posts for student's college
  const { data: jobPosts } = await supabase
    .from("job_posts")
    .select("*, companies(name, industry, location, logo_url)")
    .eq("college_id", student.college_id)
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  // Query student's applications
  const { data: myApplications } = await supabase
    .from("placement_applications")
    .select(`
      id, job_post_id, status, applied_at, notes,
      job_posts(title, companies(name))
    `)
    .eq("student_id", student.id)
    .order("applied_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Jobs</h2>
        <p className="text-muted-foreground">Browse job opportunities and manage your applications.</p>
      </div>
      <MyJobsClient
        jobPosts={jobPosts || []}
        myApplications={myApplications || []}
        studentId={student.id}
      />
    </div>
  );
}
