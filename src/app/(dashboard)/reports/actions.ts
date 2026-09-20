/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function getStudentReport(_departmentId?: string) {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select(`
      id, admission_number, status,
      profiles (first_name, last_name, email),
      departments (name),
      courses (name),
      semesters (semester_number),
      sections (name)
    `)
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false });

  if (_departmentId) query = query.eq("department_id", _departmentId);

  const { data, error } = await query;
  if (error) return { error: "Failed to load student report" };

  const students = (data || []).map((s: any) => ({
    id: s.id,
    name: `${s.profiles?.first_name || ""} ${s.profiles?.last_name || ""}`.trim(),
    email: s.profiles?.email || "",
    admissionNumber: s.admission_number,
    department: s.departments?.name || "",
    course: s.courses?.name || "",
    semester: s.semesters?.semester_number || "",
    section: s.sections?.name || "",
    status: s.status,
  }));

  const total = students.length;
  const active = students.filter((s) => s.status === "ACTIVE").length;
  const inactive = total - active;

  return { data: students, total, active, inactive };
}

export async function getAttendanceReport(_filters?: { departmentId?: string; fromDate?: string; toDate?: string }) {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const { data: records, error } = await supabase
    .from("attendance_records")
    .select(`
      id, status,
      students (id, department_id, admission_number, profiles(first_name, last_name)),
      attendance_sessions (date, subject_id, subjects(name))
    `)
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { error: "Failed to load attendance report" };

  const byDepartment: Record<string, { total: number; present: number }> = {};
  let shortageCount = 0;

  (records || []).forEach((r: any) => {
    const dept = r.students?.department_id || "Unknown";
    if (!byDepartment[dept]) byDepartment[dept] = { total: 0, present: 0 };
    byDepartment[dept].total++;
    if (r.status === "PRESENT" || r.status === "LATE") {
      byDepartment[dept].present++;
    }
  });

  const summary = Object.entries(byDepartment).map(([dept, data]) => ({
    departmentId: dept,
    total: data.total,
    present: data.present,
    rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
  }));

  const totalRecords = records?.length || 0;
  const presentRecords = records?.filter((r: any) => r.status === "PRESENT" || r.status === "LATE").length || 0;
  const overallRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  const studentAtt: Record<string, { total: number; present: number }> = {};
  (records || []).forEach((r: any) => {
    const sid = r.student_id;
    if (!studentAtt[sid]) studentAtt[sid] = { total: 0, present: 0 };
    studentAtt[sid].total++;
    if (r.status === "PRESENT" || r.status === "LATE") studentAtt[sid].present++;
  });

  Object.values(studentAtt).forEach((a) => {
    if (a.total > 0 && (a.present / a.total) * 100 < 75) shortageCount++;
  });

  return { summary, overallRate, shortageCount, totalRecords };
}

export async function getFeeReport(filters?: { departmentId?: string }) {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const { data: fees, error } = await supabase
    .from("student_fees")
    .select(`
      id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status,
      students (admission_number, profiles(first_name, last_name), department_id, departments(name)),
      fee_structures (category, academic_years(name))
    `)
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { error: "Failed to load fee report" };

  let totalDue = 0;
  let totalPaid = 0;
  let outstanding = 0;

  (fees || []).forEach((f: any) => {
    const effective = (f.amount_due || 0) + (f.late_fee_amount || 0) - (f.scholarship_amount || 0) - (f.discount_amount || 0);
    totalDue += effective;
    totalPaid += f.paid_amount || 0;
    const balance = Math.max(0, effective - (f.paid_amount || 0));
    outstanding += balance;
  });

  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  return {
    data: (fees || []).map((f: any) => ({
      id: f.id,
      student: `${f.students?.profiles?.first_name || ""} ${f.students?.profiles?.last_name || ""}`.trim(),
      admissionNumber: f.students?.admission_number || "",
      department: f.students?.departments?.name || "",
      category: f.fee_structures?.category || "",
      year: f.fee_structures?.academic_years?.name || "",
      amountDue: f.amount_due || 0,
      paidAmount: f.paid_amount || 0,
      outstanding: Math.max(0, (f.amount_due || 0) + (f.late_fee_amount || 0) - (f.scholarship_amount || 0) - (f.discount_amount || 0) - (f.paid_amount || 0)),
      status: f.status,
    })),
    totalDue,
    totalPaid,
    outstanding,
    collectionRate,
  };
}

export async function getResultReport(filters?: { departmentId?: string }) {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from("exam_marks")
    .select(`
      id, marks_obtained, status,
      students (id, admission_number, department_id, departments(name), profiles(first_name, last_name)),
      exams (name, max_marks, subjects(name))
    `)
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { error: "Failed to load result report" };

  const published = (results || []).filter((r: any) => r.status === "PUBLISHED");
  const totalPublished = published.length;
  const avgScore = totalPublished > 0
    ? Math.round(published.reduce((s: number, r: any) => s + (r.marks_obtained || 0), 0) / totalPublished)
    : 0;

  const passCount = published.filter((r: any) => {
    const max = r.exams?.max_marks || 100;
    return ((r.marks_obtained || 0) / max) * 100 >= 40;
  }).length;

  const passRate = totalPublished > 0 ? Math.round((passCount / totalPublished) * 100) : 0;

  const byDept: Record<string, { total: number; sum: number; passed: number }> = {};
  published.forEach((r: any) => {
    const dept = r.students?.departments?.name || "Unknown";
    if (!byDept[dept]) byDept[dept] = { total: 0, sum: 0, passed: 0 };
    byDept[dept].total++;
    byDept[dept].sum += r.marks_obtained || 0;
    const max = r.exams?.max_marks || 100;
    if (((r.marks_obtained || 0) / max) * 100 >= 40) byDept[dept].passed++;
  });

  const deptSummary = Object.entries(byDept).map(([name, d]) => ({
    name,
    avgMarks: d.total > 0 ? Math.round(d.sum / d.total) : 0,
    passRate: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 0,
    total: d.total,
  }));

  return { totalPublished, avgScore, passRate, deptSummary };
}

export async function getFacultyReport() {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const { data: faculty, error } = await supabase
    .from("faculty")
    .select(`
      id, designation, employment_type,
      profiles (first_name, last_name, email),
      departments (name),
      faculty_assignments (id, subjects(name, subject_code))
    `)
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to load faculty report" };

  const byDepartment: Record<string, number> = {};
  const data = (faculty || []).map((f: any) => {
    const dept = f.departments?.name || "Unknown";
    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    return {
      id: f.id,
      name: `${f.profiles?.first_name || ""} ${f.profiles?.last_name || ""}`.trim(),
      email: f.profiles?.email || "",
      department: dept,
      designation: f.designation || "",
      subjectsAssigned: f.faculty_assignments?.length || 0,
      subjects: f.faculty_assignments?.map((a: any) => a.subjects?.name).filter(Boolean).join(", ") || "",
    };
  });

  return { data, total: data.length, byDepartment };
}

export async function getLibraryReport() {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const [
    { count: totalBooks },
    { count: issuedBooks },
    { count: activeMembers },
    { count: overdueTransactions },
  ] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase
      .from("library_transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ISSUED")
      .eq("college_id", collegeId),
    supabase.from("library_members").select("id", { count: "exact", head: true }).eq("status", "ACTIVE").eq("college_id", collegeId),
    supabase
      .from("library_transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "OVERDUE")
      .eq("college_id", collegeId),
  ]);

  return {
    totalBooks: totalBooks || 0,
    issuedBooks: issuedBooks || 0,
    activeMembers: activeMembers || 0,
    overdueTransactions: overdueTransactions || 0,
  };
}

export async function getHostelReport() {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const [
    { count: totalBeds },
    { count: occupiedBeds },
  ] = await Promise.all([
    supabase.from("hostel_beds").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase
      .from("hostel_allocations")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .eq("college_id", collegeId),
  ]);

  const total = totalBeds || 0;
  const occupied = occupiedBeds || 0;
  const available = total - occupied;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return { totalBeds: total, occupiedBeds: occupied, availableBeds: available, occupancyRate };
}

export async function getTransportReport() {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const [
    { count: totalBuses },
    { count: totalRoutes },
    { count: assignedStudents },
  ] = await Promise.all([
    supabase.from("buses").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase.from("bus_routes").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase.from("transport_assignments").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
  ]);

  return {
    totalBuses: totalBuses || 0,
    totalRoutes: totalRoutes || 0,
    assignedStudents: assignedStudents || 0,
  };
}

export async function getPlacementReport() {
  const ctx = await requirePermission("reports.view");
  const collegeId = ctx.profile.college_id;
  const supabase = await createClient();

  const [
    { count: totalCompanies },
    { count: totalJobs },
    { count: totalApplicants },
    { count: selectedCount },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase.from("placement_applications").select("id", { count: "exact", head: true }).eq("college_id", collegeId),
    supabase
      .from("placement_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "SELECTED")
      .eq("college_id", collegeId),
  ]);

  const placementRate = (totalApplicants || 0) > 0
    ? Math.round(((selectedCount || 0) / (totalApplicants || 1)) * 100)
    : 0;

  return {
    totalCompanies: totalCompanies || 0,
    totalJobs: totalJobs || 0,
    totalApplicants: totalApplicants || 0,
    selectedCount: selectedCount || 0,
    placementRate,
  };
}
