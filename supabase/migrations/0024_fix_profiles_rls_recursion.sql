-- ==============================================================================
-- 0024_fix_profiles_rls_recursion.sql
-- FIX: Infinite recursion in RLS policy for "profiles" table
-- ==============================================================================
--
-- ROOT CAUSE:
--   The policy "Users can read profiles in their college" on the profiles table:
--     USING (college_id = (SELECT college_id FROM profiles WHERE id = auth.uid()))
--   ...queries the `profiles` table itself. When Postgres evaluates this sub-SELECT,
--   it triggers the same RLS policy again -> infinite recursion.
--
--   The helper function current_user_college_id() also queries profiles, but
--   SECURITY DEFINER alone does NOT bypass RLS on tables the function queries.
--   The function must explicitly SET row_security = off.
--
-- FIX (two-step):
--   1. Recreate current_user_college_id() with SET row_security = off so it
--      reads profiles without triggering any RLS policy.
--   2. Replace the self-referential profiles SELECT policy with a safe version
--      that calls the now-recursion-free helper.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Fix current_user_college_id() to bypass RLS on profiles
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_college_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT college_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid());
$$;

-- ------------------------------------------------------------------------------
-- STEP 2: Replace the recursive profiles SELECT policy
-- ------------------------------------------------------------------------------

-- Drop the original recursive policy (defined in 0000_initial_schema.sql)
DROP POLICY IF EXISTS "Users can read profiles in their college" ON profiles;

-- New policy: calls current_user_college_id() which now bypasses RLS
CREATE POLICY "Users can read profiles in their college"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    college_id = public.current_user_college_id()
  );

-- Ensure users can always read their own profile (safety fallback)
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- STEP 3: Harden the update policy
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- STEP 4: Allow authenticated users to insert their own profile row
--         (used by the auth trigger via service_role, but guards anon)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
