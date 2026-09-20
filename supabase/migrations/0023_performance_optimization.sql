-- Migration: 0023_performance_optimization.sql
-- Phase 22: Performance Optimization

-- ═══════════════════════════════════════════════════════════
-- college_id INDEXES (critical for multi-tenant filtering)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_faculty_college ON faculty(college_id);
CREATE INDEX IF NOT EXISTS idx_library_transactions_college ON library_transactions(college_id);
CREATE INDEX IF NOT EXISTS idx_library_members_college ON library_members(college_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_college ON library_fines(college_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_college ON attendance_sessions(college_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_college ON attendance_records(college_id);
CREATE INDEX IF NOT EXISTS idx_exams_college ON exams(college_id);
CREATE INDEX IF NOT EXISTS idx_assignments_college ON assignments(college_id);
CREATE INDEX IF NOT EXISTS idx_books_college ON books(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_college ON hostel_allocations(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_complaints_college ON hostel_complaints(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_visitors_college ON hostel_visitors(college_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_college ON transport_assignments(college_id);
CREATE INDEX IF NOT EXISTS idx_buses_college ON buses(college_id);
CREATE INDEX IF NOT EXISTS idx_companies_college ON companies(college_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_college ON job_posts(college_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_college ON leave_requests(college_id);
CREATE INDEX IF NOT EXISTS idx_complaints_college ON complaints(college_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_college ON support_tickets(college_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_certificates_college ON certificates(college_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_college ON student_documents(college_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_college ON student_fees(college_id);
CREATE INDEX IF NOT EXISTS idx_payments_college ON payments(college_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_college ON chat_messages(college_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_college ON automation_logs(college_id);

-- Removed: book_copies, hostel_blocks, hostel_rooms, hostel_beds, bus_stops,
--   placement_applications, placement_results, bus_routes
-- These tables do NOT have a college_id column

-- ═══════════════════════════════════════════════════════════
-- COMPOSITE INDEXES for common query patterns
-- ═══════════════════════════════════════════════════════════

-- Students list page (college + ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_students_college_created ON students(college_id, created_at DESC);

-- Faculty list page
CREATE INDEX IF NOT EXISTS idx_faculty_college_created ON faculty(college_id, created_at DESC);

-- Attendance records by session (for marking/viewing)
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_student ON attendance_records(session_id, student_id);

-- Library transactions by member (for "my library" view)
CREATE INDEX IF NOT EXISTS idx_lib_trans_member_status ON library_transactions(member_id, status);

-- Library fines by college + status
CREATE INDEX IF NOT EXISTS idx_library_fines_college_status ON library_fines(college_id, status);

-- Assignments by college + status + due date (for deadline checker)
CREATE INDEX IF NOT EXISTS idx_assignments_college_status_due ON assignments(college_id, status, deadline);

-- Library members by user_id
CREATE INDEX IF NOT EXISTS idx_library_members_user ON library_members(user_id);

-- Faculty assignments by faculty_id
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_faculty ON faculty_assignments(faculty_id);

-- Student fees by student_id
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);

-- Payments by student_id
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

-- Attendance records by student_id + college_id (for student attendance view)
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_college ON attendance_records(student_id, college_id);

-- Exam marks by student_id + college_id (for student results view)
CREATE INDEX IF NOT EXISTS idx_exam_marks_student_college ON exam_marks(student_id, college_id);

-- Certificates by student_id
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- Leave requests by requester_id (not student_id)
CREATE INDEX IF NOT EXISTS idx_leave_requests_requester ON leave_requests(requester_id);

-- Support tickets by requester_id
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets(requester_id);

-- Complaints by requester_id (not student_id)
CREATE INDEX IF NOT EXISTS idx_complaints_requester ON complaints(requester_id);

-- Placement applications by student_id
CREATE INDEX IF NOT EXISTS idx_placement_applications_student ON placement_applications(student_id);
