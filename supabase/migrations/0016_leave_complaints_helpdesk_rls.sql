-- ============================================================
-- PHASE 16: LEAVE, COMPLAINTS & HELP DESK RLS + ENHANCEMENTS
-- ============================================================

-- ─────────────────────────────────────────
-- 1. LEAVE_REQUESTS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add approval_note to leave_requests
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_requester ON leave_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_college ON leave_requests(college_id);

-- Backfill college_id from requester's profile
UPDATE leave_requests lr
SET college_id = p.college_id
FROM profiles p
WHERE lr.requester_id = p.id AND lr.college_id IS NULL;

-- ─────────────────────────────────────────
-- 2. COMPLAINTS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_complaints_requester ON complaints(requester_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_college ON complaints(college_id);

UPDATE complaints c
SET college_id = p.college_id
FROM profiles p
WHERE c.requester_id = p.id AND c.college_id IS NULL;

-- ─────────────────────────────────────────
-- 3. SUPPORT_TICKETS SCHEMA ENHANCEMENTS
-- ─────────────────────────────────────────

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ticket_number SERIAL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_college ON support_tickets(college_id);

UPDATE support_tickets st
SET college_id = p.college_id
FROM profiles p
WHERE st.requester_id = p.id AND st.college_id IS NULL;

-- ─────────────────────────────────────────
-- 4. TICKET_ACTIVITY TABLE
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON ticket_activity(ticket_id);

-- ─────────────────────────────────────────
-- 5. RLS POLICIES
-- ─────────────────────────────────────────

-- LEAVE_REQUESTS
CREATE POLICY "Users can view own leave requests"
  ON leave_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Approver can view college leave requests"
  ON leave_requests FOR SELECT
  USING (
    college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

CREATE POLICY "Students and faculty can insert leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Approver can update leave requests"
  ON leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

-- COMPLAINTS
CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Staff can view college complaints"
  ON complaints FOR SELECT
  USING (
    college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

CREATE POLICY "Users can insert own complaints"
  ON complaints FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update college complaints"
  ON complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

-- SUPPORT_TICKETS
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Staff can view college support tickets"
  ON support_tickets FOR SELECT
  USING (
    college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

CREATE POLICY "Users can insert own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND college_id IN (
      SELECT college_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update college support tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
    )
  );

-- TICKET_ACTIVITY
CREATE POLICY "Users can view activity for own tickets"
  ON ticket_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st WHERE st.id = ticket_activity.ticket_id AND st.requester_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view activity for college tickets"
  ON ticket_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_activity.ticket_id
      AND st.college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL')
      )
    )
  );

CREATE POLICY "Staff can insert activity on college tickets"
  ON ticket_activity FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_activity.ticket_id
      AND st.college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid())
    )
  );
