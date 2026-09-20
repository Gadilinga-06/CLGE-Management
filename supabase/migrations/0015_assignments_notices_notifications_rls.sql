-- Phase 14: Assignments, Notices & Notifications — RLS Policies

-- ═══════════════════════════════════════════
-- 1. ASSIGNMENTS
-- ═══════════════════════════════════════════

CREATE POLICY "Faculty view own assignments"
    ON public.assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD')
        ) OR
        -- Students can view assignments for their section
        EXISTS (
            SELECT 1 FROM public.students s
            JOIN public.sections sec ON sec.id = (SELECT section_id FROM public.sections WHERE id = s.section_id)
            WHERE s.user_id = auth.uid()
            AND s.section_id = public.assignments.section_id
        )
    );

CREATE POLICY "Faculty can manage own assignments"
    ON public.assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
        )
    );

-- ═══════════════════════════════════════════
-- 2. ASSIGNMENT SUBMISSIONS
-- ═══════════════════════════════════════════

CREATE POLICY "Students view own submissions"
    ON public.assignment_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        ) OR
        -- Faculty can view submissions for their assignments
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.faculty f ON f.id = a.faculty_id
            WHERE a.id = assignment_id AND f.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
        )
    );

CREATE POLICY "Students can submit to own assignments"
    ON public.assignment_submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update own submissions before deadline"
    ON public.assignment_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Faculty can grade submissions"
    ON public.assignment_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.faculty f ON f.id = a.faculty_id
            WHERE a.id = assignment_id AND f.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
        )
    );

-- ═══════════════════════════════════════════
-- 3. NOTICES
-- ═══════════════════════════════════════════

CREATE POLICY "Users view notices for their scope"
    ON public.notices FOR SELECT
    USING (
        college_id = public.current_user_college_id()
        AND (
            -- No targeting = visible to all in college
            (department_id IS NULL AND course_id IS NULL AND target_role IS NULL)
            -- Department targeting
            OR (department_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.user_id = auth.uid() AND s.department_id = public.notices.department_id
            ))
            -- Course targeting
            OR (course_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.user_id = auth.uid() AND s.course_id = public.notices.course_id
            ))
            -- Role targeting
            OR (target_role IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND (
                    (public.notices.target_role = 'ALL')
                    OR (public.notices.target_role = 'STUDENT' AND r.name = 'STUDENT')
                    OR (public.notices.target_role = 'FACULTY' AND r.name IN ('FACULTY', 'HOD', 'PRINCIPAL'))
                    OR (public.notices.target_role = 'PARENT' AND r.name = 'PARENT')
                )
            ))
            -- Admin/Principal can see all
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL')
            )
        )
    );

CREATE POLICY "Admin/Principal can manage notices"
    ON public.notices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL')
        )
    );

-- ═══════════════════════════════════════════
-- 4. NOTIFICATIONS
-- ═══════════════════════════════════════════

CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "College members can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.profiles WHERE college_id = public.current_user_college_id()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can mark own notifications read"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- 5. INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_assignments_faculty_id ON public.assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_assignments_section_id ON public.assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_college_id ON public.notices(college_id);
CREATE INDEX IF NOT EXISTS idx_notices_department_id ON public.notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ═══════════════════════════════════════════
-- 6. ENHANCE ASSIGNMENTS TABLE
-- ═══════════════════════════════════════════

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT'; -- DRAFT, PUBLISHED, CLOSED
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN DEFAULT false;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- Enhance notices: add semester and section targeting
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL'; -- GENERAL, ACADEMIC, EXAM, DEPARTMENT, PLACEMENT, HOLIDAY, EMERGENCY, EVENT

-- Enhance notifications: add link and category
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'SYSTEM'; -- SYSTEM, ASSIGNMENT, NOTICE, FEE, ATTENDANCE, LIBRARY, HOSTEL, TRANSPORT
