-- ==============================================================================
-- 0026_audit_logs_insert_policy.sql
-- FIX: Add INSERT policy for audit_logs + add missing college_id column
-- ==============================================================================
--
-- PROBLEM:
--   1. The audit_logs table has RLS enabled but NO INSERT policy for
--      the authenticated role. All logAudit() calls silently fail (42501).
--   2. Migration 0022 intended to add college_id to audit_logs but was
--      never applied to the live database. The logAudit() code already
--      tries to insert college_id, so the column must exist.
--
-- FIX:
--   1. Add college_id column (IF NOT EXISTS for safety).
--   2. Add an INSERT policy scoped to the user's own college.
-- ==============================================================================

-- STEP 1: Add the missing college_id column (from unapplied migration 0022)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_college ON public.audit_logs(college_id);

-- STEP 2: Add INSERT policy for authenticated users, scoped to their college
-- Use a safe DO block so the migration is idempotent (re-runnable).
DO $$
BEGIN
  -- Drop the policy if it already exists (allows re-running the migration)
  DROP POLICY IF EXISTS "College members can insert audit logs" ON public.audit_logs;

  CREATE POLICY "College members can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
      college_id = public.current_user_college_id()
    );
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, nothing to do
    NULL;
END $$;
