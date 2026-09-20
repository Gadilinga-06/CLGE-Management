-- Phase 13: Transport Management — RLS Policies

-- ═══════════════════════════════════════════
-- 1. BUSES
-- ═══════════════════════════════════════════

CREATE POLICY "Users in college can view buses"
    ON public.buses FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Transport manager/admin can manage buses"
    ON public.buses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

-- ═══════════════════════════════════════════
-- 2. DRIVERS
-- ═══════════════════════════════════════════

CREATE POLICY "Users in college can view drivers"
    ON public.drivers FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Transport manager/admin can manage drivers"
    ON public.drivers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

-- ═══════════════════════════════════════════
-- 3. ROUTES
-- ═══════════════════════════════════════════

CREATE POLICY "Users in college can view routes"
    ON public.routes FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Transport manager/admin can manage routes"
    ON public.routes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

-- ═══════════════════════════════════════════
-- 4. BUS STOPS
-- ═══════════════════════════════════════════

CREATE POLICY "Users in college can view bus stops"
    ON public.bus_stops FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.routes r
            WHERE r.id = route_id
            AND r.college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Transport manager/admin can manage bus stops"
    ON public.bus_stops FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

-- ═══════════════════════════════════════════
-- 5. TRANSPORT ASSIGNMENTS
-- ═══════════════════════════════════════════

CREATE POLICY "Students view own assignments"
    ON public.transport_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

CREATE POLICY "Transport manager/admin can manage assignments"
    ON public.transport_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TRANSPORT_MANAGER')
        )
    );

-- ═══════════════════════════════════════════
-- 6. INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_buses_college_id ON public.buses(college_id);
CREATE INDEX IF NOT EXISTS idx_drivers_college_id ON public.drivers(college_id);
CREATE INDEX IF NOT EXISTS idx_routes_college_id ON public.routes(college_id);
CREATE INDEX IF NOT EXISTS idx_bus_stops_route_id ON public.bus_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_student_id ON public.transport_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_route_id ON public.transport_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_college_year ON public.transport_assignments(route_id, academic_year_id);

-- ═══════════════════════════════════════════
-- 7. LINK TRANSPORT FEES TO FINANCE
-- ═══════════════════════════════════════════

ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS transport_assignment_id UUID REFERENCES public.transport_assignments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_student_fees_transport_assignment ON public.student_fees(transport_assignment_id);
