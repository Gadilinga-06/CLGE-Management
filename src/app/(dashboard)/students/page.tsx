import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentsClient } from "./client";

const PAGE_SIZE = 50;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canCreate = context.permissions.includes("students.create") || context.roles.includes("SUPER_ADMIN");
  const canUpdate = context.permissions.includes("students.update") || context.roles.includes("SUPER_ADMIN");
  const canDelete = context.permissions.includes("students.delete") || context.roles.includes("SUPER_ADMIN");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: students, count: total }, { data: departments }] = await Promise.all([
    supabase
      .from("students")
      .select(`
        *,
        profiles (first_name, last_name, email, avatar_url, phone),
        departments (name),
        courses (name)
      `, { count: "exact" })
      .eq("college_id", context.profile.college_id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("departments")
      .select("id, name")
      .eq("college_id", context.profile.college_id)
      .order("name"),
  ]);

  const totalPages = Math.ceil((total || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage student enrollments and profiles.
            {total ? ` ${total} total students.` : ""}
          </p>
        </div>
      </div>
      <StudentsClient
        data={students || []}
        departments={departments || []}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentPage={page}
        totalPages={totalPages}
        totalItems={total || 0}
      />
    </div>
  );
}
