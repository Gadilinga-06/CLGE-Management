-- ==============================================================================
-- 0001_auth_roles_permissions.sql
-- AUTH TRIGGER, ROLES, PERMISSIONS, AND ROLE-PERMISSION MAPPINGS
-- ==============================================================================

-- ==============================================================================
-- 1. ENABLE EXTENSIONS (must come before any gen_random_uuid() usage)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. AUTH TRIGGER FOR PROFILES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, college_id, first_name, last_name, email)
  VALUES (
    new.id,
    CAST(new.raw_user_meta_data->>'college_id' AS UUID),
    COALESCE(new.raw_user_meta_data->>'first_name', 'Unknown'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 3. HELPER FUNCTIONS FOR RLS
-- ==============================================================================

-- Returns the college_id of the currently authenticated user.
-- Used consistently in all RLS policies to avoid repetitive subqueries.
CREATE OR REPLACE FUNCTION public.current_user_college_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT college_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid());
$$;

-- Returns true if the current user has the specified role.
CREATE OR REPLACE FUNCTION public.user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = role_name
  );
$$;

-- ==============================================================================
-- 4. SEED SYSTEM ROLES (GLOBAL, college_id = NULL)
-- ==============================================================================

INSERT INTO public.roles (id, name, description) VALUES
('a0000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Full system access'),
('a0000000-0000-0000-0000-000000000002', 'COLLEGE_ADMIN', 'College-wide administration'),
('a0000000-0000-0000-0000-000000000003', 'PRINCIPAL', 'College-wide academic visibility'),
('a0000000-0000-0000-0000-000000000004', 'HOD', 'Department-scoped administration'),
('a0000000-0000-0000-0000-000000000005', 'FACULTY', 'Faculty access'),
('a0000000-0000-0000-0000-000000000006', 'ACCOUNTANT', 'Finance access'),
('a0000000-0000-0000-0000-000000000007', 'LIBRARIAN', 'Library access'),
('a0000000-0000-0000-0000-000000000008', 'WARDEN', 'Hostel access'),
('a0000000-0000-0000-0000-000000000009', 'TRANSPORT_MANAGER', 'Transport access'),
('a0000000-0000-0000-0000-000000000010', 'STUDENT', 'Student access'),
('a0000000-0000-0000-0000-000000000011', 'PARENT', 'Parent access'),
('a0000000-0000-0000-0000-000000000012', 'PLACEMENT_OFFICER', 'Manages placement activities')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. SEED BASELINE PERMISSIONS
-- ==============================================================================

INSERT INTO public.permissions (id, name, description) VALUES
(gen_random_uuid(), 'students.view', 'View students'),
(gen_random_uuid(), 'students.create', 'Create students'),
(gen_random_uuid(), 'students.update', 'Update students'),
(gen_random_uuid(), 'students.delete', 'Delete students'),
(gen_random_uuid(), 'faculty.view', 'View faculty'),
(gen_random_uuid(), 'faculty.create', 'Create faculty'),
(gen_random_uuid(), 'faculty.update', 'Update faculty'),
(gen_random_uuid(), 'faculty.delete', 'Delete faculty'),
(gen_random_uuid(), 'departments.view', 'View departments'),
(gen_random_uuid(), 'departments.create', 'Create departments'),
(gen_random_uuid(), 'departments.update', 'Update departments'),
(gen_random_uuid(), 'departments.delete', 'Delete departments'),
(gen_random_uuid(), 'attendance.view', 'View attendance'),
(gen_random_uuid(), 'attendance.create', 'Create attendance'),
(gen_random_uuid(), 'attendance.update', 'Update attendance'),
(gen_random_uuid(), 'attendance.delete', 'Delete attendance'),
(gen_random_uuid(), 'timetable.view', 'View timetables'),
(gen_random_uuid(), 'timetable.create', 'Create timetables'),
(gen_random_uuid(), 'timetable.update', 'Update timetables'),
(gen_random_uuid(), 'timetable.delete', 'Delete timetables'),
(gen_random_uuid(), 'exams.view', 'View exams'),
(gen_random_uuid(), 'exams.create', 'Create exams'),
(gen_random_uuid(), 'exams.update', 'Update exams'),
(gen_random_uuid(), 'exams.delete', 'Delete exams'),
(gen_random_uuid(), 'marks.view', 'View marks'),
(gen_random_uuid(), 'marks.enter', 'Enter marks'),
(gen_random_uuid(), 'marks.update', 'Update marks'),
(gen_random_uuid(), 'marks.publish', 'Publish marks'),
(gen_random_uuid(), 'results.view', 'View results'),
(gen_random_uuid(), 'results.generate', 'Generate results'),
(gen_random_uuid(), 'results.publish', 'Publish results'),
(gen_random_uuid(), 'fees.view', 'View fees'),
(gen_random_uuid(), 'fees.create', 'Create fees'),
(gen_random_uuid(), 'fees.update', 'Update fees'),
(gen_random_uuid(), 'fees.refund', 'Refund fees'),
(gen_random_uuid(), 'fees.report', 'View fee reports'),
(gen_random_uuid(), 'library.view', 'View library'),
(gen_random_uuid(), 'library.manage', 'Manage library'),
(gen_random_uuid(), 'library.issue', 'Issue books'),
(gen_random_uuid(), 'library.return', 'Return books'),
(gen_random_uuid(), 'hostel.view', 'View hostels'),
(gen_random_uuid(), 'hostel.manage', 'Manage hostels'),
(gen_random_uuid(), 'hostel.allocate', 'Allocate hostel beds'),
(gen_random_uuid(), 'transport.view', 'View transport'),
(gen_random_uuid(), 'transport.manage', 'Manage transport'),
(gen_random_uuid(), 'assignments.view', 'View assignments'),
(gen_random_uuid(), 'assignments.create', 'Create assignments'),
(gen_random_uuid(), 'assignments.update', 'Update assignments'),
(gen_random_uuid(), 'assignments.submit', 'Submit assignments'),
(gen_random_uuid(), 'assignments.grade', 'Grade assignments'),
(gen_random_uuid(), 'notices.view', 'View notices'),
(gen_random_uuid(), 'notices.create', 'Create notices'),
(gen_random_uuid(), 'notices.update', 'Update notices'),
(gen_random_uuid(), 'notices.delete', 'Delete notices'),
(gen_random_uuid(), 'notices.publish', 'Publish notices'),
(gen_random_uuid(), 'events.view', 'View events'),
(gen_random_uuid(), 'events.create', 'Create events'),
(gen_random_uuid(), 'events.update', 'Update events'),
(gen_random_uuid(), 'events.delete', 'Delete events'),
(gen_random_uuid(), 'placements.view', 'View placements'),
(gen_random_uuid(), 'placements.manage', 'Manage placements'),
(gen_random_uuid(), 'leave.view', 'View leave requests'),
(gen_random_uuid(), 'leave.create', 'Create leave requests'),
(gen_random_uuid(), 'leave.approve', 'Approve leave requests'),
(gen_random_uuid(), 'leave.reject', 'Reject leave requests'),
(gen_random_uuid(), 'complaints.view', 'View complaints'),
(gen_random_uuid(), 'complaints.create', 'Create complaints'),
(gen_random_uuid(), 'complaints.manage', 'Manage complaints'),
(gen_random_uuid(), 'certificates.view', 'View certificates'),
(gen_random_uuid(), 'certificates.create', 'Create certificates'),
(gen_random_uuid(), 'certificates.verify', 'Verify certificates'),
(gen_random_uuid(), 'reports.view', 'View reports'),
(gen_random_uuid(), 'reports.generate', 'Generate reports'),
(gen_random_uuid(), 'settings.view', 'View settings'),
(gen_random_uuid(), 'settings.manage', 'Manage settings'),
(gen_random_uuid(), 'users.view', 'View users'),
(gen_random_uuid(), 'users.create', 'Create users'),
(gen_random_uuid(), 'users.update', 'Update users'),
(gen_random_uuid(), 'users.disable', 'Disable users'),
(gen_random_uuid(), 'audit_logs.view', 'View audit logs')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 6. MAP PERMISSIONS TO ROLES
-- ==============================================================================

DO $$
DECLARE
    role_record RECORD;
    perm_record RECORD;
BEGIN
    FOR role_record IN SELECT id, name FROM public.roles LOOP

        -- Grant SUPER_ADMIN all permissions
        IF role_record.name = 'SUPER_ADMIN' THEN
            FOR perm_record IN SELECT id FROM public.permissions LOOP
                INSERT INTO public.role_permissions (role_id, permission_id)
                VALUES (role_record.id, perm_record.id) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;

        -- Grant COLLEGE_ADMIN most permissions (except audit_logs.view)
        IF role_record.name = 'COLLEGE_ADMIN' THEN
            FOR perm_record IN SELECT id, name FROM public.permissions LOOP
                IF perm_record.name NOT IN ('audit_logs.view') THEN
                    INSERT INTO public.role_permissions (role_id, permission_id)
                    VALUES (role_record.id, perm_record.id) ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;

        -- PRINCIPAL
        IF role_record.name = 'PRINCIPAL' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'students.view', 'faculty.view', 'attendance.view', 'exams.view',
                'results.view', 'fees.report', 'notices.view', 'notices.create',
                'notices.publish', 'reports.view', 'reports.generate'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- HOD
        IF role_record.name = 'HOD' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'students.view', 'faculty.view', 'attendance.view', 'attendance.create',
                'attendance.update', 'timetable.view', 'timetable.create', 'timetable.update',
                'exams.view', 'marks.view', 'results.view', 'reports.view', 'reports.generate'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- FACULTY
        IF role_record.name = 'FACULTY' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'students.view', 'attendance.view', 'attendance.create', 'attendance.update',
                'timetable.view', 'assignments.view', 'assignments.create', 'assignments.update',
                'assignments.grade', 'exams.view', 'marks.view', 'marks.enter', 'marks.update'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- ACCOUNTANT
        IF role_record.name = 'ACCOUNTANT' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'fees.view', 'fees.create', 'fees.update', 'fees.refund', 'fees.report'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- LIBRARIAN
        IF role_record.name = 'LIBRARIAN' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'library.view', 'library.manage', 'library.issue', 'library.return'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- WARDEN
        IF role_record.name = 'WARDEN' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'hostel.view', 'hostel.manage', 'hostel.allocate'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- TRANSPORT_MANAGER
        IF role_record.name = 'TRANSPORT_MANAGER' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'transport.view', 'transport.manage'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- STUDENT
        IF role_record.name = 'STUDENT' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'students.view', 'attendance.view', 'timetable.view', 'assignments.view',
                'assignments.submit', 'exams.view', 'results.view', 'fees.view',
                'notices.view', 'library.view'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- PARENT
        IF role_record.name = 'PARENT' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'students.view', 'attendance.view', 'results.view', 'fees.view', 'notices.view'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- PLACEMENT_OFFICER
        IF role_record.name = 'PLACEMENT_OFFICER' THEN
            INSERT INTO public.role_permissions (role_id, permission_id)
            SELECT role_record.id, id FROM public.permissions
            WHERE name IN (
                'placements.view', 'placements.manage', 'students.view'
            ) ON CONFLICT DO NOTHING;
        END IF;

    END LOOP;
END $$;

-- ==============================================================================
-- 7. REVOKE DIRECT FUNCTION EXECUTION FROM ANON
-- ==============================================================================

REVOKE EXECUTE ON FUNCTION public.current_user_college_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_role(text) FROM anon;
