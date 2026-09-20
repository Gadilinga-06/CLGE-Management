/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentProfileClient } from "./client";
import { generateStudentVerificationToken } from "@/lib/qr";

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  // Determine if user can view this student
  const isSelf = context.user.id === params.id;
  const canViewAll = context.permissions.includes("students.view") || context.roles.includes("SUPER_ADMIN");
  
  if (!isSelf && !canViewAll) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // Fetch Student data
  const { data: student } = await supabase
    .from("students")
    .select(`
      *,
      profiles (first_name, last_name, email, phone, avatar_url),
      departments (id, name),
      courses (id, name),
      semesters (id, semester_number),
      sections (id, name),
      academic_years (id, name)
    `)
    .eq("id", params.id)
    .single();

  if (!student) {
    return <div>Student not found</div>;
  }

  // Double check college separation
  if (!context.roles.includes("SUPER_ADMIN") && student.college_id !== context.profile.college_id) {
    redirect("/unauthorized");
  }

  // Generate secure QR token (no sensitive data exposed)
  const studentQRToken = generateStudentVerificationToken(student.id, student.college_id);

  // Fetch student documents
  const { data: documents } = await supabase
    .from("student_documents")
    .select("*")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  // Lookups for edit form if they have permission
  const canEdit = context.permissions.includes("students.update") || context.roles.includes("SUPER_ADMIN");
  let lookups: any = { departments: [], courses: [], semesters: [], sections: [], academicYears: [] };
  
  if (canEdit) {
    const [{ data: d }, { data: c }, { data: s }, { data: sec }, { data: ay }] = await Promise.all([
      supabase.from("departments").select("id, name").eq("college_id", context.profile.college_id),
      supabase.from("courses").select("id, name").eq("college_id", context.profile.college_id),
      supabase.from("semesters").select("id, name, semester_number"),
      supabase.from("sections").select("id, name"),
      supabase.from("academic_years").select("id, name").eq("college_id", context.profile.college_id),
    ]);
    lookups = {
      departments: d || [],
      courses: c || [],
      semesters: s || [],
      sections: sec || [],
      academicYears: ay || []
    };
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Profile</h2>
          <p className="text-muted-foreground">Manage details and documents for {student.profiles?.first_name}.</p>
        </div>
      </div>
      
      <StudentProfileClient 
        student={student} 
        documents={documents || []} 
        canEdit={canEdit}
        lookups={lookups}
        qrToken={studentQRToken}
      />
    </div>
  );
}
