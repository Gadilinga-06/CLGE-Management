-- ==============================================================================
-- seed.sql
-- DEMO DATA FOR COLLEGE MANAGEMENT SYSTEM
-- ==============================================================================
-- IMPORTANT: This seed assumes:
--   1. All migrations (0000-0023) have been applied
--   2. The auth trigger (handle_new_user) is active
--   3. pgcrypto extension is enabled
--
-- Seed order:
--   1. Colleges and academic structure (no auth dependency)
--   2. Auth users (with raw_user_meta_data for trigger)
--   3. Profiles created automatically by trigger
--   4. Roles and user-role mappings
--   5. Faculty and students
--   6. Remaining seed data
-- ==============================================================================

-- ==============================================================================
-- 1. COLLEGES AND ACADEMIC STRUCTURE
-- ==============================================================================

INSERT INTO colleges (id, name, code, email, phone, website, city, state, country)
VALUES
('d505963b-638e-4a64-91da-2cc2807e3843', 'Demo Institute of Technology', 'DIT', 'admin@dit.edu', '+1-555-0198', 'https://dit.edu', 'San Francisco', 'CA', 'USA');

INSERT INTO academic_years (id, college_id, name, start_date, end_date, is_active)
VALUES
('b9e30a5c-15a0-4ff6-8c90-95123d4a2b90', 'd505963b-638e-4a64-91da-2cc2807e3843', '2026-2027', '2026-08-01', '2027-05-31', true);

INSERT INTO departments (id, college_id, name, code)
VALUES
('10a30b2c-4f9e-4a64-91da-2cc2807e3843', 'd505963b-638e-4a64-91da-2cc2807e3843', 'Computer Science', 'CS'),
('20b40c3d-5f0f-4a64-91da-2cc2807e3843', 'd505963b-638e-4a64-91da-2cc2807e3843', 'Electrical Engineering', 'EE'),
('30c50d4e-6f10-4a64-91da-2cc2807e3843', 'd505963b-638e-4a64-91da-2cc2807e3843', 'Mechanical Engineering', 'ME');

INSERT INTO courses (id, department_id, name, code, duration_years)
VALUES
('a1111111-638e-4a64-91da-2cc2807e3843', '10a30b2c-4f9e-4a64-91da-2cc2807e3843', 'B.Tech Computer Science', 'BTCS', 4),
('b2222222-638e-4a64-91da-2cc2807e3843', '20b40c3d-5f0f-4a64-91da-2cc2807e3843', 'B.Tech Electrical Engineering', 'BTEE', 4);

INSERT INTO semesters (id, course_id, semester_number, name)
VALUES
('c3333333-638e-4a64-91da-2cc2807e3843', 'a1111111-638e-4a64-91da-2cc2807e3843', 1, 'Semester 1'),
('d4444444-638e-4a64-91da-2cc2807e3843', 'b2222222-638e-4a64-91da-2cc2807e3843', 1, 'Semester 1');

INSERT INTO sections (id, semester_id, name)
VALUES
('e5555555-638e-4a64-91da-2cc2807e3843', 'c3333333-638e-4a64-91da-2cc2807e3843', 'Section A'),
('f6666666-638e-4a64-91da-2cc2807e3843', 'c3333333-638e-4a64-91da-2cc2807e3843', 'Section B');

-- FIXED: Valid hexadecimal UUIDs for subjects
INSERT INTO subjects (id, semester_id, name, code, credits, type)
VALUES
('a0777777-638e-4a64-91da-2cc2807e3843', 'c3333333-638e-4a64-91da-2cc2807e3843', 'Programming in C', 'CS101', 4, 'CORE'),
('b0888888-638e-4a64-91da-2cc2807e3843', 'c3333333-638e-4a64-91da-2cc2807e3843', 'Engineering Mathematics I', 'MA101', 4, 'CORE');

-- ==============================================================================
-- 2. AUTH USERS (insert before profiles; trigger creates profiles)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- FIXED: raw_user_meta_data now includes college_id, first_name, last_name
-- so the handle_new_user trigger can create profiles correctly.
-- The trigger will INSERT into profiles with:
--   id = auth.users.id
--   college_id = raw_user_meta_data->>'college_id'
--   first_name = raw_user_meta_data->>'first_name'
--   last_name = raw_user_meta_data->>'last_name'
--   email = auth.users.email

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    'aa000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'admin@dit.edu',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"college_id":"d505963b-638e-4a64-91da-2cc2807e3843","first_name":"Admin","last_name":"User"}',
    now(), now(), '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'ff000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'johndoe@dit.edu',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"college_id":"d505963b-638e-4a64-91da-2cc2807e3843","first_name":"John","last_name":"Doe"}',
    now(), now(), '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'bb000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'janesmith@student.dit.edu',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"college_id":"d505963b-638e-4a64-91da-2cc2807e3843","first_name":"Jane","last_name":"Smith"}',
    now(), now(), '', '', '', ''
);

INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
) VALUES
('aa000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', 'aa000000-0000-0000-0000-000000000001', 'admin@dit.edu')::jsonb, 'email', now(), now(), now(), gen_random_uuid()),
('ff000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', 'ff000000-0000-0000-0000-000000000001', 'johndoe@dit.edu')::jsonb, 'email', now(), now(), now(), gen_random_uuid()),
('bb000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', 'bb000000-0000-0000-0000-000000000001', 'janesmith@student.dit.edu')::jsonb, 'email', now(), now(), now(), gen_random_uuid());

-- ==============================================================================
-- 3. PROFILES (created by auth trigger; do NOT insert manually)
-- ==============================================================================

-- Profiles for aa000000..., ff000000..., bb000000... are created automatically
-- by the on_auth_user_created trigger. Wait briefly or rely on transaction ordering.

-- ==============================================================================
-- 4. ROLES AND USER-ROLE MAPPINGS
-- ==============================================================================

-- Roles are seeded by migration 0001. Map users to roles here.
INSERT INTO user_roles (user_id, role_id) VALUES
('aa000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- Admin -> SUPER_ADMIN
('ff000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005'), -- John Doe -> FACULTY
('bb000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010'); -- Jane Smith -> STUDENT

-- ==============================================================================
-- 5. FACULTY AND STUDENTS
-- ==============================================================================

-- FIXED: Use user_id (profile/auth ID) for the foreign key, not the faculty record ID.
-- In the original schema, students.id is a separate record ID, students.user_id = profiles.id.

INSERT INTO faculty (id, user_id, department_id, employee_id, designation, joining_date)
VALUES
('fa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', '10a30b2c-4f9e-4a64-91da-2cc2807e3843', 'EMP001', 'Professor', '2020-01-15');

-- Set HOD
UPDATE departments SET hod_id = 'fa000000-0000-0000-0000-000000000001' WHERE id = '10a30b2c-4f9e-4a64-91da-2cc2807e3843';

-- FIXED: Valid hexadecimal UUID for student record ID (was 'st000000...')
-- students.id is a separate record ID; students.user_id references profiles(id)
INSERT INTO students (id, user_id, section_id, academic_year_id, admission_number, roll_number, gender, status)
VALUES
('bc000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'e5555555-638e-4a64-91da-2cc2807e3843', 'b9e30a5c-15a0-4ff6-8c90-95123d4a2b90', 'ADM2026001', '2026CS001', 'Female', 'ACTIVE');
