-- Migration: 0020_qr_and_automation.sql
-- Phase 19: QR Systems & Advanced Automation

-- ─── Student verification tokens ──────────────────────────
-- Stores generated QR verification tokens for students
CREATE TABLE IF NOT EXISTS student_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_student_ver_tokens_student ON student_verification_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ver_tokens_token ON student_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_student_ver_tokens_college ON student_verification_tokens(college_id);

ALTER TABLE student_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College admins can manage verification tokens"
  ON student_verification_tokens FOR ALL
  USING (college_id = (SELECT college_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Students can view their own verification tokens"
  ON student_verification_tokens FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- ─── Attendance audit log ─────────────────────────────────
-- Enhanced audit trail for QR attendance
CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- QR_SCAN, QR_GENERATE, MANUAL_MARK, TOKEN_REFRESH
  ip_address INET,
  user_agent TEXT,
  token_used TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_att_audit_session ON attendance_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_student ON attendance_audit_log(student_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_created ON attendance_audit_log(created_at);

ALTER TABLE attendance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College admins can view attendance audit logs"
  ON attendance_audit_log FOR SELECT
  USING (session_id IN (
    SELECT id FROM attendance_sessions WHERE college_id = (SELECT college_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "System can insert attendance audit logs"
  ON attendance_audit_log FOR INSERT
  WITH CHECK (true);

-- ─── Automation log ───────────────────────────────────────
-- Tracks automation runs for monitoring
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type VARCHAR(100) NOT NULL,
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  triggered BOOLEAN NOT NULL DEFAULT false,
  count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auto_logs_type ON automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_auto_logs_college ON automation_logs(college_id);
CREATE INDEX IF NOT EXISTS idx_auto_logs_started ON automation_logs(started_at);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College admins can view automation logs"
  ON automation_logs FOR ALL
  USING (college_id IS NULL OR college_id = (SELECT college_id FROM profiles WHERE id = auth.uid()));

-- ─── Attendance session QR improvements ───────────────────
-- Add used_tokens column to track which tokens have been consumed
ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS used_tokens JSONB DEFAULT '[]'::jsonb;
