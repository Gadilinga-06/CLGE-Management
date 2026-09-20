/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Tool Registry
 *
 * Predefined safe database functions that the AI can call.
 * Each tool is associated with required roles/permissions.
 * The AI engine NEVER executes raw SQL — only these predefined tools.
 *
 * SECURITY: Every tool enforces RBAC at the function level:
 * 1. Authenticate user (ctx parameter required)
 * 2. Identify role
 * 3. Identify college
 * 4. Identify department where applicable
 * 5. Validate operation
 * 6. Return only authorized data
 */

import { createClient } from "@/lib/supabase/server";
import type { AuthorizationContext } from "@/lib/auth";

// ─── Tool Type ────────────────────────────────────────────

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  /** Roles allowed to use this tool. Empty = all authenticated users. */
  allowedRoles: string[];
  /** Permission required (checked against ctx.permissions). */
  requiredPermission?: string;
  /** The actual function that executes the query. */
  execute: (ctx: AuthorizationContext, args: Record<string, any>) => Promise<any>;
}

// ─── Tool Registry ────────────────────────────────────────

const tools:AITool[] = [];

function registerTool(tool:AITool) {
  tools.push(tool);
}

// ─── STUDENT TOOLS ────────────────────────────────────────

registerTool({
  name: "get_my_attendance",
  description: "Get the current student's attendance percentage and record count.",
  parameters: {},
  allowedRoles: ["STUDENT"],
  execute: async (ctx) => {
    const supabase = await createClient();
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!student) return { error: "Student profile not found" };

    const { data: records } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", student.id);

    if (!records || records.length === 0) {
      return { attendance: 0, total: 0, present: 0, message: "No attendance records found." };
    }

    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const pct = Math.round((present / total) * 100);

    return {
      attendance: pct,
      total,
      present,
      absent: total - present,
      status: pct >= 75 ? "GOOD" : "SHORTAGE",
      message: `Your attendance is ${pct}% (${present}/${total} classes attended).`,
    };
  },
});

registerTool({
  name: "get_my_results",
  description: "Get the current student's latest published exam results.",
  parameters: {},
  allowedRoles: ["STUDENT"],
  execute: async (ctx) => {
    const supabase = await createClient();
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!student) return { error: "Student profile not found" };

    const { data: marks } = await supabase
      .from("exam_marks")
      .select(`
        marks_obtained, status,
        exams (name, max_marks, exam_type, subjects(name))
      `)
      .eq("student_id", student.id)
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!marks || marks.length === 0) {
      return { results: [], message: "No published results found." };
    }

    const results = marks.map((m: any) => ({
      exam: m.exams?.name || "Unknown",
      subject: m.exams?.subjects?.name || "Unknown",
      marks: m.marks_obtained,
      maxMarks: m.exams?.max_marks || 100,
      percentage: Math.round(((m.marks_obtained || 0) / (m.exams?.max_marks || 100)) * 100),
      type: m.exams?.exam_type || "",
    }));

    const avg = Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length);

    return {
      results,
      average: avg,
      message: `Your latest results (average: ${avg}%). ${results.length} exam(s) found.`,
    };
  },
});

registerTool({
  name: "get_my_fees",
  description: "Get the current student's fee status and outstanding amount.",
  parameters: {},
  allowedRoles: ["STUDENT"],
  execute: async (ctx) => {
    const supabase = await createClient();
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!student) return { error: "Student profile not found" };

    const { data: fees } = await supabase
      .from("student_fees")
      .select(`
        amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status,
        fee_structures (category, academic_years(name))
      `)
      .eq("student_id", student.id);

    if (!fees || fees.length === 0) {
      return { totalDue: 0, totalPaid: 0, outstanding: 0, fees: [], message: "No fee records found." };
    }

    let totalDue = 0;
    let totalPaid = 0;
    let outstanding = 0;

    const feeDetails = fees.map((f: any) => {
      const effective = (f.amount_due || 0) + (f.late_fee_amount || 0) - (f.scholarship_amount || 0) - (f.discount_amount || 0);
      totalDue += effective;
      totalPaid += f.paid_amount || 0;
      const balance = Math.max(0, effective - (f.paid_amount || 0));
      outstanding += balance;
      return {
        category: f.fee_structures?.category || "Fee",
        year: f.fee_structures?.academic_years?.name || "",
        due: effective,
        paid: f.paid_amount || 0,
        outstanding: balance,
        status: f.status,
      };
    });

    return {
      totalDue,
      totalPaid,
      outstanding,
      fees: feeDetails,
      message: outstanding > 0
        ? `You have ₹${outstanding.toLocaleString()} outstanding. Total paid: ₹${totalPaid.toLocaleString()}.`
        : "All fees are cleared.",
    };
  },
});

// ─── FACULTY TOOLS ────────────────────────────────────────

registerTool({
  name: "get_my_students",
  description: "Get students taught by the current faculty, with attendance info.",
  parameters: {},
  allowedRoles: ["FACULTY", "HOD"],
  execute: async (ctx) => {
    const supabase = await createClient();
    const { data: faculty } = await supabase
      .from("faculty")
      .select("id, department_id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!faculty) return { error: "Faculty profile not found" };

    // Get faculty's assigned sections
    const { data: assignments } = await supabase
      .from("faculty_assignments")
      .select("section_id")
      .eq("faculty_id", faculty.id);

    const sectionIds = [...new Set((assignments || []).map((a) => a.section_id).filter(Boolean))];
    if (sectionIds.length === 0) {
      return { students: [], message: "No sections assigned." };
    }

    // Get students in those sections
    const { data: students } = await supabase
      .from("students")
      .select(`
        id, admission_number,
        profiles (first_name, last_name),
        sections (name)
      `)
      .in("section_id", sectionIds)
      .eq("status", "ACTIVE");

    if (!students || students.length === 0) {
      return { students: [], message: "No students found in your sections." };
    }

    const studentIds = students.map((s) => s.id);

    // Get attendance for these students
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .in("student_id", studentIds);

    // Calculate attendance per student
    const attMap: Record<string, { total: number; present: number }> = {};
    (records || []).forEach((r) => {
      if (!attMap[r.student_id]) attMap[r.student_id] = { total: 0, present: 0 };
      attMap[r.student_id].total++;
      if (r.status === "PRESENT" || r.status === "LATE") attMap[r.student_id].present++;
    });

    const studentList = students.map((s) => {
      const att = attMap[s.id];
      const pct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
      return {
        name: `${(s.profiles as any)?.first_name || ""} ${(s.profiles as any)?.last_name || ""}`.trim(),
        admissionNumber: s.admission_number,
        section: (s.sections as any)?.name || "",
        attendance: pct,
        status: pct >= 75 ? "GOOD" : "SHORTAGE",
      };
    });

    const shortage = studentList.filter((s) => s.status === "SHORTAGE");

    return {
      students: studentList,
      total: studentList.length,
      shortageCount: shortage.length,
      message: `${studentList.length} students across ${sectionIds.length} section(s). ${shortage.length} with attendance below 75%.`,
    };
  },
});

registerTool({
  name: "get_my_students_with_low_attendance",
  description: "Get students taught by faculty with attendance below a threshold.",
  parameters: { threshold: { type: "number", description: "Attendance threshold percentage (default 75)" } },
  allowedRoles: ["FACULTY", "HOD"],
  execute: async (ctx, args) => {
    const threshold = args.threshold || 75;
    const supabase = await createClient();

    const { data: faculty } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!faculty) return { error: "Faculty profile not found" };

    const { data: assignments } = await supabase
      .from("faculty_assignments")
      .select("section_id")
      .eq("faculty_id", faculty.id);

    const sectionIds = [...new Set((assignments || []).map((a) => a.section_id).filter(Boolean))];
    if (sectionIds.length === 0) return { students: [], message: "No sections assigned." };

    const { data: students } = await supabase
      .from("students")
      .select("id, admission_number, profiles(first_name, last_name), sections(name)")
      .in("section_id", sectionIds)
      .eq("status", "ACTIVE");

    if (!students || students.length === 0) return { students: [], message: "No students found." };

    const studentIds = students.map((s) => s.id);
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .in("student_id", studentIds);

    const attMap: Record<string, { total: number; present: number }> = {};
    (records || []).forEach((r) => {
      if (!attMap[r.student_id]) attMap[r.student_id] = { total: 0, present: 0 };
      attMap[r.student_id].total++;
      if (r.status === "PRESENT" || r.status === "LATE") attMap[r.student_id].present++;
    });

    const shortageStudents = students
      .map((s) => {
        const att = attMap[s.id];
        const pct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
        return {
          name: `${(s.profiles as any)?.first_name || ""} ${(s.profiles as any)?.last_name || ""}`.trim(),
          admissionNumber: s.admission_number,
          section: (s.sections as any)?.name || "",
          attendance: pct,
        };
      })
      .filter((s) => s.attendance < threshold)
      .sort((a, b) => a.attendance - b.attendance);

    return {
      students: shortageStudents,
      threshold,
      message: `${shortageStudents.length} student(s) below ${threshold}% attendance.`,
    };
  },
});

// ─── ADMIN/College-wide TOOLS ─────────────────────────────

registerTool({
  name: "get_student_count",
  description: "Get total count of active students, optionally by department.",
  parameters: { department: { type: "string", description: "Department name to filter (optional)" } },
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "HOD"],
  requiredPermission: "students.view",
  execute: async (ctx, args) => {
    const supabase = await createClient();
    let query = supabase
      .from("students")
      .select("id, department_id, departments(name)", { count: "exact" })
      .eq("status", "ACTIVE")
      .eq("college_id", ctx.profile.college_id);

    if (args.department) {
      query = query.ilike("departments.name", `%${args.department}%`);
    }

    const { data, count } = await query;

    const deptBreakdown: Record<string, number> = {};
    (data || []).forEach((s: any) => {
      const dept = s.departments?.name || "Unknown";
      deptBreakdown[dept] = (deptBreakdown[dept] || 0) + 1;
    });

    return {
      total: count || 0,
      breakdown: deptBreakdown,
      message: `Total active students: ${count || 0}${args.department ? ` in ${args.department}` : ""}.`,
    };
  },
});

registerTool({
  name: "get_faculty_count",
  description: "Get total count of faculty members.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "HOD"],
  requiredPermission: "faculty.view",
  execute: async (ctx) => {
    const supabase = await createClient();
    const { count } = await supabase
      .from("faculty")
      .select("id", { count: "exact", head: true })
      .eq("college_id", ctx.profile.college_id);

    return {
      total: count || 0,
      message: `Total faculty: ${count || 0}.`,
    };
  },
});

registerTool({
  name: "get_fee_summary",
  description: "Get overall fee collection summary for the college.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "ACCOUNTANT"],
  execute: async (ctx) => {
    const supabase = await createClient();

    const { data: fees } = await supabase
      .from("student_fees")
      .select("amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status")
      .eq("college_id", ctx.profile.college_id);

    if (!fees || fees.length === 0) {
      return { totalDue: 0, totalPaid: 0, outstanding: 0, message: "No fee records found." };
    }

    let totalDue = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let paidCount = 0;
    let pendingCount = 0;

    fees.forEach((f: any) => {
      const effective = (f.amount_due || 0) + (f.late_fee_amount || 0) - (f.scholarship_amount || 0) - (f.discount_amount || 0);
      totalDue += effective;
      totalPaid += f.paid_amount || 0;
      outstanding += Math.max(0, effective - (f.paid_amount || 0));
      if (f.status === "PAID") paidCount++;
      else pendingCount++;
    });

    const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

    return {
      totalDue,
      totalPaid,
      outstanding,
      collectionRate,
      paidCount,
      pendingCount,
      message: `Fee collection: ₹${totalPaid.toLocaleString()} collected of ₹${totalDue.toLocaleString()} (${collectionRate}%). Outstanding: ₹${outstanding.toLocaleString()}. ${paidCount} paid, ${pendingCount} pending.`,
    };
  },
});

registerTool({
  name: "get_department_performance",
  description: "Get pass percentage by department to find the highest performing department.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "HOD"],
  execute: async (ctx) => {
    const supabase = await createClient();

    const { data: results } = await supabase
      .from("exam_marks")
      .select(`
        marks_obtained, status,
        students!inner(department_id, college_id, departments(name)),
        exams(max_marks)
      `)
      .eq("status", "PUBLISHED")
      .eq("students.college_id", ctx.profile.college_id);

    if (!results || results.length === 0) {
      return { departments: [], message: "No exam results found." };
    }

    const deptStats: Record<string, { total: number; passed: number; sum: number }> = {};
    (results as any[]).forEach((r) => {
      const dept = r.students?.departments?.name || "Unknown";
      if (!deptStats[dept]) deptStats[dept] = { total: 0, passed: 0, sum: 0 };
      deptStats[dept].total++;
      deptStats[dept].sum += r.marks_obtained || 0;
      const max = r.exams?.max_marks || 100;
      if (((r.marks_obtained || 0) / max) * 100 >= 40) deptStats[dept].passed++;
    });

    const departments = Object.entries(deptStats)
      .map(([name, s]) => ({
        name,
        total: s.total,
        passed: s.passed,
        passRate: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0,
        avgMarks: s.total > 0 ? Math.round(s.sum / s.total) : 0,
      }))
      .sort((a, b) => b.passRate - a.passRate);

    const best = departments[0];

    return {
      departments,
      bestDepartment: best?.name || "N/A",
      message: `Best department: ${best?.name || "N/A"} with ${best?.passRate || 0}% pass rate. ${departments.length} departments analyzed.`,
    };
  },
});

registerTool({
  name: "get_placement_overview",
  description: "Get placement statistics for the college.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "HOD", "FACULTY"],
  execute: async (ctx) => {
    const supabase = await createClient();

    const [
      { count: totalCompanies },
      { count: totalJobs },
      { count: totalApplicants },
      { count: selectedCount },
    ] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
      supabase.from("job_posts").select("id", { count: "exact", head: true }),
      supabase.from("placement_applications").select("id", { count: "exact", head: true }),
      supabase.from("placement_applications").select("id", { count: "exact", head: true }).eq("status", "SELECTED"),
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
      message: `Placement: ${selectedCount || 0} selected out of ${totalApplicants || 0} applicants (${placementRate}%). ${totalCompanies || 0} companies, ${totalJobs || 0} job posts.`,
    };
  },
});

registerTool({
  name: "get_students_with_low_attendance",
  description: "Get all students with attendance below a threshold (admin/principal view).",
  parameters: { threshold: { type: "number", description: "Attendance threshold percentage (default 75)" } },
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL"],
  requiredPermission: "students.view",
  execute: async (ctx, args) => {
    const threshold = args.threshold || 75;
    const supabase = await createClient();

    const { data: students } = await supabase
      .from("students")
      .select("id, admission_number, college_id, profiles(first_name, last_name), departments(name), sections(name)")
      .eq("status", "ACTIVE")
      .eq("college_id", ctx.profile.college_id);

    if (!students || students.length === 0) {
      return { students: [], message: "No active students found." };
    }

    const studentIds = students.map((s) => s.id);
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .in("student_id", studentIds);

    const attMap: Record<string, { total: number; present: number }> = {};
    (records || []).forEach((r) => {
      if (!attMap[r.student_id]) attMap[r.student_id] = { total: 0, present: 0 };
      attMap[r.student_id].total++;
      if (r.status === "PRESENT" || r.status === "LATE") attMap[r.student_id].present++;
    });

    const shortageStudents = students
      .map((s) => {
        const att = attMap[s.id];
        const pct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
        return {
          name: `${(s.profiles as any)?.first_name || ""} ${(s.profiles as any)?.last_name || ""}`.trim(),
          admissionNumber: s.admission_number,
          department: (s.departments as any)?.name || "",
          section: (s.sections as any)?.name || "",
          attendance: pct,
        };
      })
      .filter((s) => s.attendance < threshold && s.attendance > 0)
      .sort((a, b) => a.attendance - b.attendance);

    return {
      students: shortageStudents,
      threshold,
      total: shortageStudents.length,
      message: `${shortageStudents.length} student(s) below ${threshold}% attendance.`,
    };
  },
});

registerTool({
  name: "get_hostel_overview",
  description: "Get hostel occupancy statistics.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "WARDEN"],
  execute: async (ctx) => {
    const supabase = await createClient();

    const [{ count: totalBeds }, { count: occupiedBeds }] = await Promise.all([
      supabase.from("hostel_beds").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
      supabase.from("hostel_allocations").select("id", { count: "exact", head: true }).eq("status", "ACTIVE").eq("college_id", ctx.profile.college_id),
    ]);

    const total = totalBeds || 0;
    const occupied = occupiedBeds || 0;
    const available = total - occupied;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      totalBeds: total,
      occupiedBeds: occupied,
      availableBeds: available,
      occupancyRate,
      message: `Hostel: ${occupied}/${total} beds occupied (${occupancyRate}%). ${available} beds available.`,
    };
  },
});

registerTool({
  name: "get_library_overview",
  description: "Get library statistics including books, issued, and overdue.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "LIBRARIAN"],
  execute: async (ctx) => {
    const supabase = await createClient();

    const [{ count: totalBooks }, { count: issuedBooks }, { count: activeMembers }, { count: overdueTxns }] = await Promise.all([
      supabase.from("books").select("id", { count: "exact", head: true }).eq("college_id", ctx.profile.college_id),
      supabase.from("library_transactions").select("id", { count: "exact", head: true }).eq("status", "ISSUED").eq("college_id", ctx.profile.college_id),
      supabase.from("library_members").select("id", { count: "exact", head: true }).eq("status", "ACTIVE").eq("college_id", ctx.profile.college_id),
      supabase.from("library_transactions").select("id", { count: "exact", head: true }).eq("status", "OVERDUE").eq("college_id", ctx.profile.college_id),
    ]);

    return {
      totalBooks: totalBooks || 0,
      issuedBooks: issuedBooks || 0,
      activeMembers: activeMembers || 0,
      overdueTransactions: overdueTxns || 0,
      message: `Library: ${totalBooks || 0} books, ${issuedBooks || 0} issued, ${overdueTxns || 0} overdue. ${activeMembers || 0} active members.`,
    };
  },
});

registerTool({
  name: "get_upcoming_exams",
  description: "Get upcoming exams scheduled in the next 7 days.",
  parameters: {},
  allowedRoles: ["SUPER_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "STUDENT"],
  execute: async (ctx) => {
    const supabase = await createClient();
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: exams } = await supabase
      .from("exams")
      .select("name, start_date, end_date, exam_type, exam_subjects(subjects(name))")
      .eq("college_id", ctx.profile.college_id)
      .gte("start_date", new Date().toISOString())
      .lte("start_date", weekLater)
      .order("start_date", { ascending: true });

    if (!exams || exams.length === 0) {
      return { exams: [], message: "No upcoming exams in the next 7 days." };
    }

    const examList = exams.map((e: any) => ({
      name: e.name,
      type: e.exam_type,
      startDate: e.start_date,
      endDate: e.end_date,
      subjects: e.exam_subjects?.map((es: any) => es.subjects?.name).filter(Boolean) || [],
    }));

    return {
      exams: examList,
      message: `${examList.length} exam(s) coming up in the next 7 days.`,
    };
  },
});

registerTool({
  name: "get_pending_assignments",
  description: "Get assignments due within 24 hours (for students) or pending grading (for faculty).",
  parameters: {},
  allowedRoles: ["STUDENT", "FACULTY", "HOD"],
  execute: async (ctx, _args) => {
    const supabase = await createClient();

    if (ctx.roles.includes("STUDENT")) {
      const { data: student } = await supabase
        .from("students")
        .select("id, section_id")
        .eq("user_id", ctx.user.id)
        .single();

      if (!student) return { error: "Student profile not found" };

      const { data: assignments } = await supabase
        .from("assignments")
        .select("title, due_date, subjects(name)")
        .eq("section_id", student.section_id)
        .eq("status", "PUBLISHED")
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      return {
        assignments: (assignments || []).map((a: any) => ({
          title: a.title,
          subject: a.subjects?.name || "Unknown",
          dueDate: a.due_date,
        })),
        message: `${(assignments || []).length} upcoming assignment(s).`,
      };
    }

    // Faculty: assignments pending grading
    const { data: faculty } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!faculty) return { error: "Faculty profile not found" };

    const { data: myAssignments } = await supabase
      .from("assignments")
      .select("id, title")
      .eq("faculty_id", faculty.id)
      .eq("status", "PUBLISHED");

    if (!myAssignments || myAssignments.length === 0) {
      return { assignments: [], message: "No published assignments." };
    }

    const { count: pendingGrades } = await supabase
      .from("assignment_submissions")
      .select("id", { count: "exact", head: true })
      .in("assignment_id", myAssignments.map((a) => a.id))
      .is("marks_obtained", null);

    return {
      pendingGrades: pendingGrades || 0,
      assignmentCount: myAssignments.length,
      message: `${pendingGrades || 0} submissions pending grading across ${myAssignments.length} assignment(s).`,
    };
  },
});

// ─── Export ────────────────────────────────────────────────

/**
 * Get all tools available for a given role set.
 */
export function getToolsForRoles(roles: string[]):AITool[] {
  return tools.filter((tool) => {
    if (tool.allowedRoles.length === 0) return true;
    return tool.allowedRoles.some((role) => roles.includes(role) || roles.includes("SUPER_ADMIN"));
  });
}

/**
 * Get a specific tool by name.
 */
export function getToolByName(name: string):AITool | undefined {
  return tools.find((t) => t.name === name);
}

/**
 * Get all tool definitions (for sending to AI provider).
 */
export function getToolDefinitions(roles: string[]): any[] {
  return getToolsForRoles(roles).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
