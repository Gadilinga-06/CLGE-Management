-- Phase 12: Hostel Management Enhancements

-- 1. Enhance hostels: add capacity, description, floor count
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 1;
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add floor to hostel_blocks
ALTER TABLE public.hostel_blocks ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 1;
ALTER TABLE public.hostel_blocks ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Enhance hostel_rooms: add type, amenities
ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'SHARED'; -- SHARED, PRIVATE, SUITE
ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS has_ac BOOLEAN DEFAULT false;
ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS has_attached_bath BOOLEAN DEFAULT false;
ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2) DEFAULT 0;

-- 4. Enhance hostel_allocations: add college_id for RLS, notes
ALTER TABLE public.hostel_allocations ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;
ALTER TABLE public.hostel_allocations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.hostel_allocations ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.hostel_allocations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Hostel complaints table
CREATE TABLE IF NOT EXISTS public.hostel_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- MAINTENANCE, CLEANLINESS, FOOD, SECURITY, NOISE, OTHER
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visitor log table
CREATE TABLE IF NOT EXISTS public.hostel_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(50),
    relation VARCHAR(100),
    purpose TEXT,
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'CHECKED_IN', -- CHECKED_IN, CHECKED_OUT, DENIED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on all hostel tables
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_visitors ENABLE ROW LEVEL SECURITY;

-- RLS: hostels
CREATE POLICY "Anyone in college can view hostels"
    ON public.hostels FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Warden/Admin can manage hostels"
    ON public.hostels FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_blocks
CREATE POLICY "Anyone in college can view blocks"
    ON public.hostel_blocks FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_id AND h.college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Warden/Admin can manage blocks"
    ON public.hostel_blocks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_rooms
CREATE POLICY "Anyone in college can view rooms"
    ON public.hostel_rooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hostel_blocks hb
            JOIN public.hostels h ON hb.hostel_id = h.id
            WHERE hb.id = block_id AND h.college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Warden/Admin can manage rooms"
    ON public.hostel_rooms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_beds
CREATE POLICY "Anyone in college can view beds"
    ON public.hostel_beds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hostel_rooms hr
            JOIN public.hostel_blocks hb ON hr.block_id = hb.id
            JOIN public.hostels h ON hb.hostel_id = h.id
            WHERE hr.id = room_id AND h.college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Warden/Admin can manage beds"
    ON public.hostel_beds FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_allocations
CREATE POLICY "Students view own allocations"
    ON public.hostel_allocations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

CREATE POLICY "Warden/Admin can manage allocations"
    ON public.hostel_allocations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_complaints
CREATE POLICY "Students view own complaints"
    ON public.hostel_complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

CREATE POLICY "Students can create hostel complaints"
    ON public.hostel_complaints FOR INSERT
    WITH CHECK (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Warden/Admin can manage complaints"
    ON public.hostel_complaints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- RLS: hostel_visitors
CREATE POLICY "Students view own visitors"
    ON public.hostel_visitors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

CREATE POLICY "Warden/Admin can manage visitors"
    ON public.hostel_visitors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN')
        )
    );

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_hostels_college_id ON public.hostels(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_student_id ON public.hostel_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_college_id ON public.hostel_allocations(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_complaints_college_id ON public.hostel_complaints(college_id);
CREATE INDEX IF NOT EXISTS idx_hostel_visitors_college_id ON public.hostel_visitors(college_id);
