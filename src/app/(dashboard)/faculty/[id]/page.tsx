import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FacultyProfileClient } from "./client";

export default async function FacultyProfilePage({ params }: { params: { id: string } }) {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const isSelf = context.user.id === params.id;
  const canViewAll = context.permissions.includes("faculty.view") || context.roles.includes("SUPER_ADMIN") || context.roles.includes("HOD");
  
  if (!isSelf && !canViewAll) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: faculty } = await supabase
    .from("faculty")
    .select(`
      *,
      profiles (first_name, last_name, email, phone, avatar_url),
      departments (id, name),
      faculty_assignments (
        id,
        subjects (id, name, subject_code),
        sections (id, name),
        semesters (id, semester_number),
        academic_years (id, name)
      )
    `)
    .eq("id", params.id)
    .single();

  if (!faculty) {
    return <div>Faculty not found</div>;
  }

  if (!context.roles.includes("SUPER_ADMIN") && faculty.college_id !== context.profile.college_id) {
    redirect("/unauthorized");
  }

  const { data: documents } = await supabase
    .from("faculty_documents")
    .select("*")
    .eq("faculty_id", params.id)
    .order("created_at", { ascending: false });

  const canEdit = context.permissions.includes("faculty.update") || context.roles.includes("SUPER_ADMIN");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lookups: any = { departments: [], subjects: [], sections: [], semesters: [], academicYears: [] };
  
  if (canEdit) {
    const [{ data: d }, { data: sub }, { data: sec }, { data: sem }, { data: ay }] = await Promise.all([
      supabase.from("departments").select("id, name").eq("college_id", context.profile.college_id),
      supabase.from("subjects").select("id, name, subject_code").eq("college_id", context.profile.college_id),
      supabase.from("sections").select("id, name").eq("college_id", context.profile.college_id),
      supabase.from("semesters").select("id, semester_number"),
      supabase.from("academic_years").select("id, name").eq("college_id", context.profile.college_id),
    ]);
    lookups = {
      departments: d || [],
      subjects: sub || [],
      sections: sec || [],
      semesters: sem || [],
      academicYears: ay || []
    };
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty Profile</h2>
          <p className="text-muted-foreground">Manage details and assignments for {faculty.profiles?.first_name}.</p>
        </div>
      </div>
      
      <FacultyProfileClient 
        faculty={faculty} 
        documents={documents || []} 
        canEdit={canEdit}
        lookups={lookups}
      />
    </div>
  );
}
