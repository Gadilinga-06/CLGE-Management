/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "./client";

export default async function ReportsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.permissions.includes("reports.view") && !ctx.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // Fetch all stats in parallel
  const [
    { count: totalStudents },
    { count: totalFaculty },
    { count: totalDepartments },
    { data: attendanceRecords },
    { data: monthPayments },
    { count: publishedResults },
    { count: totalCompanies },
    { count: totalJobs },
    { count: placementApps },
    { count: selectedCount },
    { count: totalBooks },
    { count: issuedBooks },
    { count: libraryMembers },
    { count: overdueTxns },
    { count: totalBeds },
    { count: occupiedBeds },
    { count: totalBuses },
    { count: totalRoutes },
    { count: transportStudents },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("faculty").select("id", { count: "exact", head: true }),
    supabase.from("departments").select("id", { count: "exact", head: true }),
    supabase.from("attendance_records").select("status"),
    supabase.from("payments").select("amount").eq("status", "COMPLETED"),
    supabase.from("exam_marks").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("job_posts").select("id", { count: "exact", head: true }),
    supabase.from("placement_applications").select("id", { count: "exact", head: true }),
    supabase.from("placement_applications").select("id", { count: "exact", head: true }).eq("status", "SELECTED"),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("library_transactions").select("id", { count: "exact", head: true }).eq("status", "ISSUED"),
    supabase.from("library_members").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("library_transactions").select("id", { count: "exact", head: true }).eq("status", "OVERDUE"),
    supabase.from("hostel_beds").select("id", { count: "exact", head: true }),
    supabase.from("hostel_allocations").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("buses").select("id", { count: "exact", head: true }),
    supabase.from("bus_routes").select("id", { count: "exact", head: true }),
    supabase.from("transport_assignments").select("id", { count: "exact", head: true }),
  ]);

  const totalAtt = attendanceRecords?.length || 0;
  const presentAtt = attendanceRecords?.filter((r: any) => r.status === "PRESENT" || r.status === "LATE").length || 0;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

  const totalCollected = monthPayments?.reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0;

  const placementRate = (placementApps || 0) > 0
    ? Math.round(((selectedCount || 0) / (placementApps || 1)) * 100)
    : 0;

  const hostelTotal = totalBeds || 0;
  const hostelOccupied = occupiedBeds || 0;
  const hostelOccupancy = hostelTotal > 0 ? Math.round((hostelOccupied / hostelTotal) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive reports across all college modules.
        </p>
      </div>
      <ReportsClient
        overview={{
          totalStudents: totalStudents || 0,
          totalFaculty: totalFaculty || 0,
          totalDepartments: totalDepartments || 0,
          attendanceRate,
          totalCollected,
          publishedResults: publishedResults || 0,
          placementRate,
          libraryMembers: libraryMembers || 0,
          totalBooks: totalBooks || 0,
          issuedBooks: issuedBooks || 0,
          overdueBooks: overdueTxns || 0,
          hostelOccupancy,
          totalBeds: hostelTotal,
          occupiedBeds: hostelOccupied,
          totalBuses: totalBuses || 0,
          totalRoutes: totalRoutes || 0,
          transportStudents: transportStudents || 0,
          totalCompanies: totalCompanies || 0,
          totalJobs: totalJobs || 0,
          totalApplicants: placementApps || 0,
          selectedCount: selectedCount || 0,
        }}
      />
    </div>
  );
}
