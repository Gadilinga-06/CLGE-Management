-- ==============================================================================
-- 0004_faculty_management.sql
-- ADD MISSING FACULTY COLUMNS AND RLS POLICIES
-- ==============================================================================
-- NOTE: The faculty table is created in 0000_initial_schema.sql.
-- This migration adds tables that extend faculty management.

-- 1. Recreate faculty_documents with college_id for RLS scoping
DROP TABLE IF EXISTS public.faculty_documents CASCADE;

CREATE TABLE public.faculty_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faculty_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can view their own documents or admins can view all"
    ON public.faculty_documents FOR SELECT
    USING (
        faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

CREATE POLICY "Faculty can upload their own documents or admins can upload"
    ON public.faculty_documents FOR INSERT
    WITH CHECK (
        faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

CREATE POLICY "College admins can manage faculty documents"
    ON public.faculty_documents FOR ALL
    USING (
        faculty_id IN (
            SELECT id FROM public.faculty
            WHERE college_id = public.current_user_college_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
        )
    );

-- 2. Faculty assignments table
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculty_id, subject_id, section_id, semester_id, academic_year_id)
);

ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments in their college"
    ON public.faculty_assignments FOR SELECT
    USING (college_id = public.current_user_college_id());

CREATE POLICY "College admins can manage faculty assignments"
    ON public.faculty_assignments FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

-- 3. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('faculty-assets', 'faculty-assets', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Faculty can read own assets" ON storage.objects FOR SELECT
    USING (bucket_id = 'faculty-assets' AND (auth.uid() = owner OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'));

CREATE POLICY "Admins can read all faculty assets" ON storage.objects FOR SELECT
    USING (bucket_id = 'faculty-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
    ));

CREATE POLICY "Faculty can upload assets" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'faculty-assets');

CREATE POLICY "Admins can delete faculty assets" ON storage.objects FOR DELETE
    USING (bucket_id = 'faculty-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
    ));
