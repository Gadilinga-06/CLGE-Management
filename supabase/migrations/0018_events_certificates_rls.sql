-- ============================================================
-- PHASE 18: EVENTS & CERTIFICATES RLS + ENHANCEMENTS
-- ============================================================

-- ─────────────────────────────────────────
-- 1. EVENTS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- ─────────────────────────────────────────
-- 2. EVENT_REGISTRATIONS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS attended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_student ON event_registrations(student_id);

-- ─────────────────────────────────────────
-- 3. CERTIFICATES SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(100) DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS student_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_college ON certificates(college_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);

-- Backfill college_id and student_name from student
UPDATE certificates c
SET college_id = s.college_id,
    student_name = p.first_name || ' ' || p.last_name
FROM students s
JOIN profiles p ON s.user_id = p.id
WHERE c.student_id = s.id
AND (c.college_id IS NULL OR c.student_name IS NULL);

-- ─────────────────────────────────────────
-- 4. RLS POLICIES
-- ─────────────────────────────────────────

-- EVENTS
CREATE POLICY "College users can view events"
  ON events FOR SELECT
  USING (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL', 'FACULTY')
    )
  );

-- EVENT_REGISTRATIONS
CREATE POLICY "Students can view own registrations"
  ON event_registrations FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff can view all registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL', 'FACULTY')
    )
  );

CREATE POLICY "Students can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can cancel own registrations"
  ON event_registrations FOR UPDATE
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff can manage registrations"
  ON event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL', 'FACULTY')
    )
  );

-- CERTIFICATES
CREATE POLICY "Students can view own certificates"
  ON certificates FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff can view college certificates"
  ON certificates FOR SELECT
  USING (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

CREATE POLICY "Staff can create certificates"
  ON certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

CREATE POLICY "Anyone can verify certificates by ID"
  ON certificates FOR SELECT
  USING (true);
