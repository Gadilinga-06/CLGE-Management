-- ==============================================================================
-- 0007_exams_results.sql
-- EXAMS, MARKS & RESULTS SCHEMA
-- ==============================================================================

-- 1. Grading Rules
CREATE TABLE IF NOT EXISTS public.grading_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    grade VARCHAR(5) NOT NULL,
    grade_point NUMERIC(4,2) NOT NULL,
    min_percentage NUMERIC(5,2) NOT NULL,
    max_percentage NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id, grade)
);

ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College members can view grading rules"
    ON public.grading_rules FOR SELECT
    USING (college_id = public.current_user_college_id());

CREATE POLICY "College admins can manage grading rules"
    ON public.grading_rules FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
        )
    );

-- 2. Exams
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College members can view exams"
    ON public.exams FOR SELECT
    USING (college_id = public.current_user_college_id());

CREATE POLICY "College admins can manage exams"
    ON public.exams FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

-- 3. Exam Subjects
CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    min_pass_marks NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, subject_id)
);

ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College members can view exam subjects"
    ON public.exam_subjects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            WHERE e.id = exam_id
            AND e.college_id = public.current_user_college_id()
        )
    );

CREATE POLICY "College admins can manage exam subjects"
    ON public.exam_subjects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            WHERE e.id = exam_id
            AND e.college_id = public.current_user_college_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );

-- 4. Exam Marks
CREATE TABLE IF NOT EXISTS public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id, subject_id)
);

ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own published marks"
    ON public.exam_marks FOR SELECT
    USING (
        (
            student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
            AND status = 'PUBLISHED'
        )
        OR (
            college_id = public.current_user_college_id()
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
            )
        )
    );

CREATE POLICY "Faculty can insert marks"
    ON public.exam_marks FOR INSERT
    WITH CHECK (
        college_id = public.current_user_college_id()
        AND (
            faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
            )
        )
    );

CREATE POLICY "Faculty can update draft marks"
    ON public.exam_marks FOR UPDATE
    USING (
        college_id = public.current_user_college_id()
        AND (
            (faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()) AND status IN ('DRAFT', 'SUBMITTED'))
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
            )
        )
    )
    WITH CHECK (
        college_id = public.current_user_college_id()
    );

CREATE POLICY "Faculty can delete draft marks"
    ON public.exam_marks FOR DELETE
    USING (
        college_id = public.current_user_college_id()
        AND (
            (faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()) AND status = 'DRAFT')
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
            )
        )
    );
