-- ==============================================================================
-- 0003_student_management.sql
-- ADD MISSING STUDENT COLUMNS AND RLS POLICIES
-- ==============================================================================
-- NOTE: The students table is created in 0000_initial_schema.sql.
-- This migration adds columns that were missing from the original schema.
-- We use ALTER TABLE, NOT CREATE TABLE IF NOT EXISTS.

-- 1. Add missing columns to students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS department_id UUID
    REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id UUID
    REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semester_id UUID
    REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 2. Recreate student_documents with college_id for RLS scoping
-- Drop the old version from 0000 if it exists
DROP TABLE IF EXISTS public.student_documents CASCADE;

CREATE TABLE public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents or admins can view all"
    ON public.student_documents FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
        )
    );

CREATE POLICY "Users can upload their own documents or admins can upload"
    ON public.student_documents FOR INSERT
    WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
        )
    );

CREATE POLICY "College admins can manage student documents"
    ON public.student_documents FOR ALL
    USING (
        student_id IN (
            SELECT id FROM public.students
            WHERE college_id = public.current_user_college_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

-- 3. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('student-assets', 'student-assets', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can read own assets" ON storage.objects FOR SELECT
    USING (bucket_id = 'student-assets' AND (auth.uid() = owner OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'));

CREATE POLICY "Admins can read all assets" ON storage.objects FOR SELECT
    USING (bucket_id = 'student-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
    ));

CREATE POLICY "Users can upload assets" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'student-assets');

CREATE POLICY "Admins can delete assets" ON storage.objects FOR DELETE
    USING (bucket_id = 'student-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
    ));
