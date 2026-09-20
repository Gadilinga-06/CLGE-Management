-- Phase 8: Timetable Management Schema
-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- MONDAY, TUESDAY, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Additional check to ensure valid times
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Note: Complex conflict detection (overlapping times) is better handled at the application layer 
-- or via complex exclusion constraints (which require btree_gist extension). We will rely on 
-- application layer validation for double-booking prevention as planned.

-- Enable RLS
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timetables in their college"
    ON public.timetable_slots FOR SELECT
    USING (
        college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins and HODs can manage timetables"
    ON public.timetable_slots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD')
        )
    );
