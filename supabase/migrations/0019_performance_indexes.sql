-- Migration: 0019_performance_indexes.sql
-- Performance indexes for dashboards and reports

-- Students: department + status composite (for dashboard counts)
CREATE INDEX IF NOT EXISTS idx_students_dept_status ON public.students(department_id, status);

-- Attendance records: student_id (for per-student attendance queries)
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);

-- Attendance records: status (for rate calculations)
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

-- Attendance sessions: date (for attendance trend queries)
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);

-- Exam marks: student_id + status (for student results)
CREATE INDEX IF NOT EXISTS idx_exam_marks_student_status ON public.exam_marks(student_id, status);

-- Exam marks: status (for published results count)
CREATE INDEX IF NOT EXISTS idx_exam_marks_status ON public.exam_marks(status);

-- Payments: status + payment_date (for monthly collection)
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON public.payments(status, payment_date);

-- Library transactions: status + due_date (for overdue queries)
CREATE INDEX IF NOT EXISTS idx_lib_trans_status_due ON public.library_transactions(status, due_date);

-- Hostel allocations: status (for occupancy queries)
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_status ON public.hostel_allocations(status);

-- Timetable slots: faculty_id + day_of_week (for faculty schedule)
CREATE INDEX IF NOT EXISTS idx_timetable_faculty_day ON public.timetable_slots(faculty_id, day_of_week);

-- Timetable slots: section_id + day_of_week (for student schedule)
CREATE INDEX IF NOT EXISTS idx_timetable_section_day ON public.timetable_slots(section_id, day_of_week);

-- Assignment submissions: assignment_id + marks_obtained (for pending grades)
CREATE INDEX IF NOT EXISTS idx_assignment_sub_grade ON public.assignment_submissions(assignment_id, marks_obtained);

-- Student fees: student_id + status (for fee outstanding queries)
CREATE INDEX IF NOT EXISTS idx_student_fees_student_status ON public.student_fees(student_id, status);
