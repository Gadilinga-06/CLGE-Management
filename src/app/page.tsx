/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboard } from "@/components/students/student-dashboard";
import { FacultyDashboard } from "@/components/faculty/faculty-dashboard";
import { HodDashboard } from "@/components/hod/hod-dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function DashboardPage() {
  let context;
  try {
    context = await getAuthorizationContext();
  } catch (e: any) {
    return <div className="p-8"><h1>Auth Error</h1><pre>{e?.message || String(e)}</pre></div>;
  }
  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Account Not Configured</h1>
          <p className="text-muted-foreground mb-4">
            Your account exists but has no profile or role assigned.
            Please contact an administrator to set up your account.
          </p>
        </div>
      </div>
    );
  }

  let role = "";
  let data: any = {};
  let errorMsg: string | null = null;

  try {
    const supabase = await createClient();

    // ── Student ──────────────────────────────────────────────
    if (context.roles.includes("STUDENT")) {
      role = "STUDENT";

      const { data: student } = await supabase
        .from("students")
        .select("*, profiles(*), courses(name), semesters(semester_number)")
        .eq("id", context.user.id)
        .single();

      if (!student) {
        data = { student: null };
      } else {
        const [attResult, feeResult, resultCountResult, assignmentCountResult, noticeCountResult] = await Promise.all([
          supabase
            .from("attendance_records")
            .select("status")
            .eq("student_id", student.id),
          supabase
            .from("student_fees")
            .select("amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status")
            .eq("student_id", student.id)
            .in("status", ["PENDING", "PARTIAL"]),
          supabase
            .from("exam_marks")
            .select("id", { count: "exact", head: true })
            .eq("student_id", student.id)
            .eq("status", "PUBLISHED"),
          supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .eq("section_id", student.section_id)
            .eq("status", "PUBLISHED"),
          student.user_id ? supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", student.user_id)
            .eq("is_read", false) : { count: 0 },
        ]);

        const attData = attResult.data || [];
        const totalAtt = attData.length;
        const presentAtt = attData.filter((r: any) => r.status === "PRESENT" || r.status === "LATE").length;
        const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        const feeData = feeResult.data || [];
        const outstandingFees = feeData.reduce((sum: number, sf: any) => {
          const effective = (sf.amount_due || 0) + (sf.late_fee_amount || 0) - (sf.scholarship_amount || 0) - (sf.discount_amount || 0);
          return sum + Math.max(0, effective - (sf.paid_amount || 0));
        }, 0);

        const { data: recentAttRecords } = await supabase
          .from("attendance_records")
          .select("status, attendance_sessions(date)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(30);

        const attTrend: Record<string, { total: number; present: number }> = {};
        (recentAttRecords || []).forEach((r: any) => {
          const d = r.attendance_sessions?.date;
          if (!d) return;
          if (!attTrend[d]) attTrend[d] = { total: 0, present: 0 };
          attTrend[d].total++;
          if (r.status === "PRESENT" || r.status === "LATE") attTrend[d].present++;
        });
        const attendanceTrend = Object.entries(attTrend)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, v]) => ({
            date,
            rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
          }));

        const { data: examMarks } = await supabase
          .from("exam_marks")
          .select("marks_obtained, exams(max_marks, name)")
          .eq("student_id", student.id)
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: true });

        const gradeHistory = (examMarks || []).map((m: any) => ({
          exam: m.exams?.name || "Exam",
          marks: m.marks_obtained || 0,
          maxMarks: m.exams?.max_marks || 100,
        }));

        data = {
          student,
          serverData: {
            attendancePct,
            outstandingFees,
            publishedResultsCount: resultCountResult.count || 0,
            pendingAssignments: assignmentCountResult.count || 0,
            unreadNotices: (noticeCountResult as any).count || 0,
            classesToday: 0,
            attendanceTrend,
            gradeHistory,
          },
        };
      }
    }

    // ── Faculty ──────────────────────────────────────────────
    else if (context.roles.includes("FACULTY")) {
      role = "FACULTY";

      const { data: faculty } = await supabase
        .from("faculty")
        .select(`
          *, 
          profiles(*), 
          departments(name),
          faculty_assignments (
            id,
            subjects (id, name, subject_code),
            sections (id, name),
            semesters (id, semester_number)
          )
        `)
        .eq("id", context.user.id)
        .single();

      if (!faculty) {
        data = { faculty: null };
      } else {
        const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const today = days[new Date().getDay()];

        const [timetableResult, pendingGradeResult, noticeCountResult] = await Promise.all([
          supabase
            .from("timetable_slots")
            .select("id, start_time, end_time, subjects(name, subject_code), sections(name), rooms(room_number)")
            .eq("faculty_id", faculty.id)
            .eq("day_of_week", today)
            .order("start_time", { ascending: true }),
          (async () => {
            const assignmentIds = faculty.faculty_assignments?.map((a: any) => a.id) || [];
            if (assignmentIds.length === 0) return { count: 0 };
            const { count } = await supabase
              .from("assignment_submissions")
              .select("id", { count: "exact", head: true })
              .in("assignment_id", assignmentIds)
              .is("marks_obtained", null);
            return { count: count || 0 };
          })(),
          faculty.user_id ? supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", faculty.user_id)
            .eq("is_read", false) : { count: 0 },
        ]);

        let attendanceBySubject: { name: string; rate: number }[] = [];

        if (faculty.faculty_assignments && faculty.faculty_assignments.length > 0) {
          const subjectStats = await Promise.all(
            faculty.faculty_assignments.map(async (fa: any) => {
              const { data: records } = await supabase
                .from("attendance_records")
                .select("status, attendance_sessions!inner(faculty_id)")
                .eq("attendance_sessions.faculty_id", faculty.id);

              const total = records?.length || 0;
              const present = records?.filter((r: any) => r.status === "PRESENT" || r.status === "LATE").length || 0;
              return {
                name: fa.subjects?.name || "Unknown",
                rate: total > 0 ? Math.round((present / total) * 100) : 0,
              };
            })
          );
          attendanceBySubject = subjectStats;
        }

        data = {
          faculty,
          serverData: {
            todaysClasses: timetableResult.data || [],
            pendingGrades: pendingGradeResult.count || 0,
            unreadNotices: (noticeCountResult as any).count || 0,
            attendanceBySubject,
          },
        };
      }
    }

    // ── HOD ──────────────────────────────────────────────────
    else if (context.roles.includes("HOD")) {
      role = "HOD";

      const { data: faculty } = await supabase
        .from("faculty")
        .select("*, profiles(*), departments(id, name)")
        .eq("user_id", context.user.id)
        .single();

      if (!faculty?.department_id) {
        data = {
          department: null,
          stats: { totalStudents: 0, totalFaculty: 0, avgAttendance: 0, avgResults: 0, departmentName: "" },
          chartData: { facultyWorkload: [], attendanceBySubject: [], resultsBySubject: [] },
        };
      } else {
        const deptId = faculty.department_id;

        const [
          { count: totalStudents },
          { count: totalFaculty },
          { data: attendanceRecords },
          { data: examResults },
          { data: deptFaculty },
        ] = await Promise.all([
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("department_id", deptId)
            .eq("status", "ACTIVE"),
          supabase
            .from("faculty")
            .select("id", { count: "exact", head: true })
            .eq("department_id", deptId),
          supabase
            .from("attendance_records")
            .select("status, students!inner(department_id)")
            .eq("students.department_id", deptId),
          supabase
            .from("exam_marks")
            .select("marks_obtained, students!inner(department_id)")
            .eq("students.department_id", deptId),
          supabase
            .from("faculty")
            .select(`
              id, profiles(first_name, last_name),
              faculty_assignments(id, subjects(name))
            `)
            .eq("department_id", deptId),
        ]);

        const totalAtt = attendanceRecords?.length || 0;
        const presentAtt = attendanceRecords?.filter(
          (r: any) => r.status === "PRESENT" || r.status === "LATE"
        ).length || 0;
        const avgAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        const avgResults = examResults && examResults.length > 0
          ? Math.round(examResults.reduce((s: number, r: any) => s + (r.marks_obtained || 0), 0) / examResults.length)
          : 0;

        const facultyWorkload = (deptFaculty || []).map((f: any) => ({
          name: `${f.profiles?.first_name || ""} ${f.profiles?.last_name || ""}`.trim() || "Unknown",
          subjects: f.faculty_assignments?.length || 0,
        }));

        const { data: deptStudents } = await supabase
          .from("students")
          .select("id")
          .eq("department_id", deptId)
          .eq("status", "ACTIVE");

        const studentIds = (deptStudents || []).map((s: any) => s.id);

        let attendanceBySubject: { name: string; rate: number }[] = [];
        let resultsBySubject: { name: string; avg: number }[] = [];

        if (studentIds.length > 0) {
          const { data: attWithSubjects } = await supabase
            .from("attendance_records")
            .select("status, attendance_sessions!inner(subject_id, subjects(name))")
            .in("student_id", studentIds);

          const bySubj: Record<string, { total: number; present: number; name: string }> = {};
          (attWithSubjects || []).forEach((r: any) => {
            const sid = r.attendance_sessions?.subject_id;
            const name = r.attendance_sessions?.subjects?.name || "Unknown";
            if (!sid) return;
            if (!bySubj[sid]) bySubj[sid] = { total: 0, present: 0, name };
            bySubj[sid].total++;
            if (r.status === "PRESENT" || r.status === "LATE") bySubj[sid].present++;
          });
          attendanceBySubject = Object.values(bySubj).map(v => ({
            name: v.name,
            rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
          }));

          const { data: resWithSubjects } = await supabase
            .from("exam_marks")
            .select("marks_obtained, exams(subject_id, subjects(name))")
            .in("student_id", studentIds)
            .eq("status", "PUBLISHED");

          const byResSubj: Record<string, { sum: number; count: number; name: string }> = {};
          (resWithSubjects || []).forEach((r: any) => {
            const sid = r.exams?.subject_id;
            const name = r.exams?.subjects?.name || "Unknown";
            if (!sid) return;
            if (!byResSubj[sid]) byResSubj[sid] = { sum: 0, count: 0, name };
            byResSubj[sid].sum += r.marks_obtained || 0;
            byResSubj[sid].count++;
          });
          resultsBySubject = Object.values(byResSubj).map(v => ({
            name: v.name,
            avg: v.count > 0 ? Math.round(v.sum / v.count) : 0,
          }));
        }

        data = {
          department: faculty.departments,
          stats: {
            totalStudents: totalStudents || 0,
            totalFaculty: totalFaculty || 0,
            avgAttendance,
            avgResults,
            departmentName: faculty.departments?.name || "",
          },
          chartData: { facultyWorkload, attendanceBySubject, resultsBySubject },
        };
      }
    }

    // ── Admin / Default ──────────────────────────────────────
    else {
      role = "ADMIN";

      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const weekAgoDate = new Date();
      weekAgoDate.setDate(weekAgoDate.getDate() - 7);
      const weekAgo = weekAgoDate.toISOString().split("T")[0];

      const [
        { count: totalStudents },
        { count: totalFaculty },
        { count: totalDepartments },
        { data: todayRecords },
        { data: monthPayments },
        { count: publishedResults },
        { count: placementApplications },
        { count: selectedCount },
        { count: libraryMembers },
        { count: hostelOccupied },
        { count: transportStudents },
        { data: studentsByDeptRaw },
        { data: weeklyAttRecords },
        { data: topFeeData },
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
        supabase.from("faculty").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("attendance_records").select("status"),
        supabase.from("payments").select("amount").eq("status", "COMPLETED").gte("payment_date", firstOfMonth),
        supabase.from("exam_marks").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("placement_applications").select("id", { count: "exact", head: true }),
        supabase.from("placement_applications").select("id", { count: "exact", head: true }).eq("status", "SELECTED"),
        supabase.from("library_members").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
        supabase.from("hostel_allocations").select("id", { count: "exact", head: true }),
        supabase.from("transport_assignments").select("id", { count: "exact", head: true }),
        supabase.from("students").select("department_id, departments(name)").eq("status", "ACTIVE"),
        supabase.from("attendance_records").select("status, attendance_sessions(date)").gte("attendance_sessions.date", weekAgo),
        supabase.from("student_fees").select("amount_due, paid_amount, status"),
      ]);

      const totalToday = todayRecords?.length || 0;
      const presentToday = todayRecords?.filter((r: any) => r.status === "PRESENT" || r.status === "LATE").length || 0;
      const todayAttendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

      const monthFeeCollection = monthPayments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

      const placementRate = (placementApplications || 0) > 0
        ? Math.round(((selectedCount || 0) / (placementApplications || 1)) * 100)
        : 0;

      const deptMap: Record<string, { name: string; count: number }> = {};
      (studentsByDeptRaw || []).forEach((s: any) => {
        const key = s.department_id || "Unknown";
        if (!deptMap[key]) deptMap[key] = { name: s.departments?.name || "Unknown", count: 0 };
        deptMap[key].count++;
      });
      const studentsByDept = Object.values(deptMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const dayMap: Record<string, { total: number; present: number }> = {};
      (weeklyAttRecords || []).forEach((r: any) => {
        const d = r.attendance_sessions?.date;
        if (!d) return;
        if (!dayMap[d]) dayMap[d] = { total: 0, present: 0 };
        dayMap[d].total++;
        if (r.status === "PRESENT" || r.status === "LATE") dayMap[d].present++;
      });
      const attendanceTrend = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          day: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
          rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        }));

      const totalDue = topFeeData?.reduce((s: number, f: any) => {
        const eff = (f.amount_due || 0) - (f.paid_amount || 0);
        return s + Math.max(0, eff);
      }, 0) || 0;
      const totalPaidAmt = topFeeData?.filter((f: any) => f.status === "PAID").reduce((s: number, f: any) => s + (f.paid_amount || 0), 0) || 0;

      const hostelTotal = (await supabase.from("hostel_beds").select("id", { count: "exact", head: true })).count || 0;
      const hostelOccupancy = hostelTotal > 0 ? Math.round(((hostelOccupied || 0) / hostelTotal) * 100) : 0;

      data = {
        stats: {
          totalStudents: totalStudents || 0,
          totalFaculty: totalFaculty || 0,
          totalDepartments: totalDepartments || 0,
          todayAttendanceRate,
          monthFeeCollection,
          publishedResults: publishedResults || 0,
          placementRate,
          libraryMembers: libraryMembers || 0,
          hostelOccupancy,
          transportStudents: transportStudents || 0,
        },
        chartData: {
          studentsByDept,
          attendanceTrend,
          feeCollection: { collected: totalPaidAmt, outstanding: totalDue },
        },
      };
    }
  } catch (e: any) {
    errorMsg = e?.message || String(e);
  }

  if (errorMsg) {
    return (
      <div className="p-8">
        <h1>Dashboard Error</h1>
        <pre className="text-red-500 whitespace-pre-wrap">{errorMsg}</pre>
      </div>
    );
  }

  if (role === "STUDENT") {
    return (
      <StudentDashboard
        student={data.student}
        serverData={data.serverData}
      />
    );
  }

  if (role === "FACULTY") {
    return (
      <FacultyDashboard
        faculty={data.faculty}
        serverData={data.serverData}
      />
    );
  }

  if (role === "HOD") {
    return (
      <HodDashboard
        department={data.department}
        stats={data.stats}
        chartData={data.chartData}
      />
    );
  }

  return (
    <AdminDashboard
      stats={data.stats}
      chartData={data.chartData}
    />
  );
}
