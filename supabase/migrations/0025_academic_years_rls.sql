-- ==============================================================================
-- 0025_academic_years_rls.sql
-- FIX: Add missing RLS policies for academic_years table
-- ==============================================================================
--
-- PROBLEM:
--   The academic_years table has RLS enabled (from 0000_initial_schema.sql)
--   but no CREATE POLICY statements exist for it. With RLS on and no policies,
--   all queries from the anon/authenticated client are silently blocked.
--
-- FIX:
--   Add SELECT (all authenticated users) and INSERT/UPDATE/DELETE (admins only)
--   policies scoped to college_id.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SELECT: All authenticated users can read academic years for their college
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view academic years" ON academic_years;

CREATE POLICY "Authenticated users can view academic years"
  ON academic_years
  FOR SELECT
  TO authenticated
  USING (
    college_id = public.current_user_college_id()
  );

-- ------------------------------------------------------------------------------
-- INSERT: College admins and super admins can create academic years
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "College admins can manage academic years" ON academic_years;

CREATE POLICY "College admins can manage academic years"
  ON academic_years
  FOR ALL
  USING (
    college_id = public.current_user_college_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
    )
  )
  WITH CHECK (
    college_id = public.current_user_college_id()
  );
