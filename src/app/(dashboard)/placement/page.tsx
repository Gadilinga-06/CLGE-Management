/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlacementDashboardClient } from "./client";

export default async function PlacementPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.permissions.includes("placements.view") && !ctx.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const collegeId = ctx.profile.college_id;

  const [
    { count: totalCompanies },
    { count: totalJobs },
    { count: totalApplicants },
    { count: selectedCount },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase
      .from("placement_applications")
      .select("id", { count: "exact", head: true })
      .in("job_post_id",
        (await supabase.from("job_posts").select("id").eq("college_id", collegeId)).data?.map((j: any) => j.id) || []
      ),
    supabase
      .from("placement_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "SELECTED")
      .in("job_post_id",
        (await supabase.from("job_posts").select("id").eq("college_id", collegeId)).data?.map((j: any) => j.id) || []
      ),
  ]);

  // Get job post IDs for this college
  const { data: collegeJobIds } = await supabase
    .from("job_posts")
    .select("id")
    .eq("college_id", collegeId);

  const jobPostIds = collegeJobIds?.map((j: any) => j.id) || [];

  // Average and highest package from job_posts joined with selected applications
  let avgPackage = 0;
  let highestPackage = 0;

  if (jobPostIds.length > 0) {
    const { data: selectedApps } = await supabase
      .from("placement_applications")
      .select("job_posts(package_amount)")
      .eq("status", "SELECTED")
      .in("job_post_id", jobPostIds);

    if (selectedApps && selectedApps.length > 0) {
      const packages = selectedApps
        .map((a: any) => a.job_posts?.package_amount)
        .filter((p: any) => p != null && p > 0);
      if (packages.length > 0) {
        avgPackage = packages.reduce((sum: number, p: number) => sum + p, 0) / packages.length;
        highestPackage = Math.max(...packages);
      }
    }
  }

  // Fetch related data
  const [{ data: companies }, { data: jobPosts }, { data: applications }] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_posts")
      .select("*, companies(name, industry)")
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("placement_applications")
      .select(`
        id, job_post_id, student_id, resume_url, status, applied_at, notes, updated_at,
        students(admission_number, profiles(first_name, last_name, email)),
        job_posts(title, companies(name))
      `)
      .in("job_post_id", jobPostIds)
      .order("applied_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Placement Management</h2>
          <p className="text-muted-foreground">Manage companies, job posts, and track applications.</p>
        </div>
      </div>
      <PlacementDashboardClient
        companies={companies || []}
        jobPosts={jobPosts || []}
        applications={applications || []}
        stats={{
          totalCompanies: totalCompanies || 0,
          totalJobs: totalJobs || 0,
          totalApplicants: totalApplicants || 0,
          selectedCount: selectedCount || 0,
          avgPackage,
          highestPackage,
        }}
      />
    </div>
  );
}
