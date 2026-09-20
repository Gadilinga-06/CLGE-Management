-- ==============================================================================
-- 0022_security_hardening.sql
-- SECURITY HARDENING: FIX POLICY NAMES, ADD WITH CHECK, COLLEGE SCOPING
-- ==============================================================================

-- Add college_id to audit_logs for multi-tenant isolation
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_college ON audit_logs(college_id);

-- ==============================================================================
-- FIX STUDENTS POLICIES
-- ==============================================================================

-- Drop the original policy from 0003 (exact name match)
DROP POLICY IF EXISTS "Admins and Faculty can manage students" ON students;

-- Also drop the security hardening version if it exists from a previous run
DROP POLICY IF EXISTS "College admins can manage students" ON students;

CREATE POLICY "College admins can manage students"
  ON students FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

-- ==============================================================================
-- FIX FACULTY POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "Admins and HODs can manage faculty" ON faculty;
DROP POLICY IF EXISTS "College admins can manage faculty" ON faculty;

CREATE POLICY "College admins can manage faculty"
  ON faculty FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

-- ==============================================================================
-- FIX ATTENDANCE RECORDS POLICIES
-- ==============================================================================

-- The original policy from 0005 is named "Faculty and Admins can update records"
DROP POLICY IF EXISTS "Faculty and Admins can update records" ON attendance_records;
DROP POLICY IF EXISTS "Faculty and Admins can delete records" ON attendance_records;
DROP POLICY IF EXISTS "Faculty and Admins can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "College admins can manage attendance records" ON attendance_records;

CREATE POLICY "College admins can manage attendance records"
  ON attendance_records FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

-- ==============================================================================
-- FIX EXAM MARKS POLICIES
-- ==============================================================================

-- The original policies from 0007 are named:
-- "Faculty can insert marks", "Faculty can update draft marks", "Faculty can delete draft marks"
DROP POLICY IF EXISTS "Faculty can insert marks" ON exam_marks;
DROP POLICY IF EXISTS "Faculty can update draft marks" ON exam_marks;
DROP POLICY IF EXISTS "Faculty can delete draft marks" ON exam_marks;
DROP POLICY IF EXISTS "Students can view their own published marks" ON exam_marks;
DROP POLICY IF EXISTS "Faculty can insert/update/delete marks" ON exam_marks;
DROP POLICY IF EXISTS "College faculty can manage exam marks" ON exam_marks;

CREATE POLICY "College faculty can manage exam marks"
  ON exam_marks FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

CREATE POLICY "Students can view their own published marks"
  ON exam_marks FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND status = 'PUBLISHED'
  );

-- ==============================================================================
-- FIX STUDENT DOCUMENTS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "Admins can manage documents" ON student_documents;
DROP POLICY IF EXISTS "College admins can manage student documents" ON student_documents;

CREATE POLICY "College admins can manage student documents"
  ON student_documents FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE college_id = public.current_user_college_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE college_id = public.current_user_college_id()
    )
  );

-- ==============================================================================
-- FIX FACULTY ASSIGNMENTS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "Admins and HODs can manage faculty assignments" ON faculty_assignments;
DROP POLICY IF EXISTS "College admins can manage faculty assignments" ON faculty_assignments;

CREATE POLICY "College admins can manage faculty assignments"
  ON faculty_assignments FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

-- ==============================================================================
-- FIX FACULTY DOCUMENTS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "Admins can manage faculty documents" ON faculty_documents;
DROP POLICY IF EXISTS "College admins can manage faculty documents" ON faculty_documents;

CREATE POLICY "College admins can manage faculty documents"
  ON faculty_documents FOR ALL
  USING (
    faculty_id IN (
      SELECT id FROM faculty WHERE college_id = public.current_user_college_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
    )
  )
  WITH CHECK (
    faculty_id IN (
      SELECT id FROM faculty WHERE college_id = public.current_user_college_id()
    )
  );

-- ==============================================================================
-- FIX PLACEMENT POLICIES (use PLACEMENT_OFFICER, not PLACEMENT)
-- ==============================================================================

DROP POLICY IF EXISTS "Placement staff can update companies" ON companies;
DROP POLICY IF EXISTS "College placement staff can manage companies" ON companies;
DROP POLICY IF EXISTS "Placement staff can update job posts" ON job_posts;
DROP POLICY IF EXISTS "College placement staff can manage job posts" ON job_posts;
DROP POLICY IF EXISTS "Placement staff can update applications" ON placement_applications;
DROP POLICY IF EXISTS "College placement staff can manage applications" ON placement_applications;
DROP POLICY IF EXISTS "Placement staff can insert/update results" ON placement_results;
DROP POLICY IF EXISTS "College placement staff can manage results" ON placement_results;

CREATE POLICY "College placement staff can manage companies"
  ON companies FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT_OFFICER')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

CREATE POLICY "College placement staff can manage job posts"
  ON job_posts FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT_OFFICER')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );

CREATE POLICY "College placement staff can manage applications"
  ON placement_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_posts jp
      WHERE jp.id = job_post_id
      AND jp.college_id = public.current_user_college_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT_OFFICER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_posts jp
      WHERE jp.id = job_post_id
      AND jp.college_id = public.current_user_college_id()
    )
  );

CREATE POLICY "College placement staff can manage results"
  ON placement_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM placement_applications pa
      JOIN job_posts jp ON jp.id = pa.job_post_id
      WHERE pa.id = application_id
      AND jp.college_id = public.current_user_college_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT_OFFICER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM placement_applications pa
      JOIN job_posts jp ON jp.id = pa.job_post_id
      WHERE pa.id = application_id
      AND jp.college_id = public.current_user_college_id()
    )
  );

-- ==============================================================================
-- FIX CERTIFICATE VERIFICATION
-- ==============================================================================
-- The original policy "Anyone can verify certificates by ID" allowed public (unauthenticated)
-- verification. If public verification is needed, use a SECURITY DEFINER function or a
-- public view instead of exposing the entire certificates table.

DROP POLICY IF EXISTS "Anyone can verify certificates by ID" ON certificates;
DROP POLICY IF EXISTS "College members can view certificates" ON certificates;

-- Restrict to authenticated users in the same college
CREATE POLICY "College members can view certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE college_id = public.current_user_college_id()
    )
  );

-- For public verification, create a security-definer function:
CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_id VARCHAR)
RETURNS TABLE (
    certificate_id VARCHAR,
    certificate_type VARCHAR,
    student_name TEXT,
    issue_date DATE,
    verification_status VARCHAR
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_id,
    c.certificate_type,
    s.first_name || ' ' || s.last_name AS student_name,
    c.issue_date,
    c.verification_status
  FROM certificates c
  JOIN students st ON st.id = c.student_id
  JOIN profiles s ON s.id = st.user_id
  WHERE c.certificate_id = p_certificate_id;
$$;

-- ==============================================================================
-- FIX COLLEGES TABLE POLICY
-- ==============================================================================

DROP POLICY IF EXISTS "Colleges are readable by everyone" ON colleges;
DROP POLICY IF EXISTS "Authenticated users can view their college" ON colleges;

CREATE POLICY "Authenticated users can view their college"
  ON colleges FOR SELECT
  TO authenticated
  USING (
    id = public.current_user_college_id()
    OR public.user_has_role('SUPER_ADMIN')
  );

-- ==============================================================================
-- FIX NOTIFICATION INSERT POLICY
-- ==============================================================================

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Notifications should only be created by trusted backend functions.
-- Restrict insert to service_role only (enforced by Supabase, not RLS).
-- For API-role inserts, require the user to be in the same college.
CREATE POLICY "College members can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE college_id = public.current_user_college_id()
    )
    OR user_id = auth.uid()
  );
