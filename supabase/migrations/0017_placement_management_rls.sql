-- ============================================================
-- PHASE 17: PLACEMENT MANAGEMENT RLS + ENHANCEMENTS
-- ============================================================

-- ─────────────────────────────────────────
-- 1. COMPANIES SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_companies_college ON companies(college_id);

-- ─────────────────────────────────────────
-- 2. JOB_POSTS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS eligibility TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT,
  ADD COLUMN IF NOT EXISTS package_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS max_applicants INTEGER,
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_job_posts_company ON job_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_college ON job_posts(college_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);

-- Backfill college_id from company
UPDATE job_posts jp
SET college_id = c.college_id
FROM companies c
WHERE jp.company_id = c.id AND jp.college_id IS NULL;

-- ─────────────────────────────────────────
-- 3. PLACEMENT_APPLICATIONS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE placement_applications
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_placement_app_job ON placement_applications(job_post_id);
CREATE INDEX IF NOT EXISTS idx_placement_app_student ON placement_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_app_status ON placement_applications(status);

-- ─────────────────────────────────────────
-- 4. PLACEMENT_RESULTS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE placement_results
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_placement_results_app ON placement_results(application_id);

-- ─────────────────────────────────────────
-- 5. RLS POLICIES
-- ─────────────────────────────────────────

-- COMPANIES
CREATE POLICY "Placement staff can view companies"
  ON companies FOR SELECT
  USING (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Students can view companies with open jobs"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_posts jp
      WHERE jp.company_id = companies.id
      AND jp.status = 'OPEN'
      AND jp.college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Placement staff can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Placement staff can update companies"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

-- JOB_POSTS
CREATE POLICY "Placement staff can view all job posts"
  ON job_posts FOR SELECT
  USING (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Students can view open job posts"
  ON job_posts FOR SELECT
  USING (
    status = 'OPEN'
    AND college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Placement staff can insert job posts"
  ON job_posts FOR INSERT
  WITH CHECK (
    college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Placement staff can update job posts"
  ON job_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

-- PLACEMENT_APPLICATIONS
CREATE POLICY "Students can view own applications"
  ON placement_applications FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Placement staff can view all applications"
  ON placement_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Students can insert own applications"
  ON placement_applications FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Placement staff can update applications"
  ON placement_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

-- PLACEMENT_RESULTS
CREATE POLICY "Students can view own results"
  ON placement_results FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM placement_applications
      WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Placement staff can view all results"
  ON placement_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Placement staff can insert results"
  ON placement_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );

CREATE POLICY "Placement staff can update results"
  ON placement_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PLACEMENT')
    )
  );
