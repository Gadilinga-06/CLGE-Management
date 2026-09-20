-- ==============================================================================
-- 0005_attendance.sql
-- ATTENDANCE MANAGEMENT SCHEMA
-- ==============================================================================

-- 1. Attendance Sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    qr_token VARCHAR(255),
    qr_expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section_id, subject_id, date, start_time)
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College members can view sessions"
    ON public.attendance_sessions FOR SELECT
    USING (college_id = public.current_user_college_id());

CREATE POLICY "Faculty can manage their own sessions"
    ON public.attendance_sessions FOR ALL
    USING (
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

-- 2. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    recorded_via VARCHAR(20) DEFAULT 'MANUAL',
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own records"
    ON public.attendance_records FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
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

CREATE POLICY "Faculty and admins can insert attendance records"
    ON public.attendance_records FOR INSERT
    WITH CHECK (
        college_id = public.current_user_college_id()
        AND (
            student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
            )
        )
    );

CREATE POLICY "Faculty and admins can update attendance records"
    ON public.attendance_records FOR UPDATE
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
        )
    )
    WITH CHECK (
        college_id = public.current_user_college_id()
    );

CREATE POLICY "Faculty and admins can delete attendance records"
    ON public.attendance_records FOR DELETE
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY')
        )
    );
