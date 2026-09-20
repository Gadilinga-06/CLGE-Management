import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeeStructuresClient } from "./client";

export default async function FeeStructuresPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isFinance = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"].includes(r));
  if (!isFinance) redirect("/unauthorized");

  const supabase = await createClient();

  const [
    { data: feeStructures },
    { data: academicYears },
    { data: courses },
    { data: semesters },
  ] = await Promise.all([
    supabase
      .from("fee_structures")
      .select(`
        id, category, amount, due_date, semester_id, student_category,
        late_fee_per_day, late_fee_max, grace_days,
        academic_years (name),
        courses (name, code, id)
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: false }),
    supabase.from("academic_years").select("id, name").eq("college_id", ctx.profile.college_id),
    supabase
      .from("courses")
      .select("id, name, code")
      .in("department_id",
        (await supabase
          .from("departments")
          .select("id")
          .eq("college_id", ctx.profile.college_id)
        ).data?.map((d: { id: string }) => d.id) || []
      ),
    supabase
      .from("semesters")
      .select("id, name, semester_number, course_id"),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fee Structures</h2>
        <p className="text-muted-foreground">Configure and assign fee templates to courses and academic years.</p>
      </div>
      <FeeStructuresClient
        feeStructures={feeStructures || []}
        academicYears={academicYears || []}
        courses={courses || []}
        semesters={semesters || []}
      />
    </div>
  );
}
