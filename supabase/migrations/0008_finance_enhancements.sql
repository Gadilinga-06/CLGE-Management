-- ==============================================================================
-- 0008_finance_enhancements.sql
-- FINANCE SCHEMA ENHANCEMENTS
-- ==============================================================================

-- 1. Add college_id for RLS scoping (with IF NOT EXISTS for idempotency)
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- 2. Enhance payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_metadata JSONB;

-- 3. Enhance student_fees
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS scholarship_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 4. RLS Policies with college scoping

-- fee_structures
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College members can view fee structures"
    ON public.fee_structures FOR SELECT
    USING (college_id = public.current_user_college_id());

CREATE POLICY "College admins can manage fee structures"
    ON public.fee_structures FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
        )
    );

-- student_fees
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own fees"
    ON public.student_fees FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR (
            college_id = public.current_user_college_id()
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
            )
        )
    );

CREATE POLICY "College admins can manage student fees"
    ON public.student_fees FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
        )
    );

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own payments"
    ON public.payments FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR (
            EXISTS (
                SELECT 1 FROM public.student_fees sf
                WHERE sf.id = student_fee_id
                AND sf.college_id = public.current_user_college_id()
            )
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
            )
        )
    );

CREATE POLICY "College admins can manage payments"
    ON public.payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.student_fees sf
            WHERE sf.id = student_fee_id
            AND sf.college_id = public.current_user_college_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
        )
    );

-- receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own receipts"
    ON public.receipts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            WHERE p.id = payment_id
            AND p.student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR (
            EXISTS (
                SELECT 1 FROM public.payments p
                JOIN public.student_fees sf ON sf.id = p.student_fee_id
                WHERE p.id = payment_id
                AND sf.college_id = public.current_user_college_id()
            )
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
            )
        )
    );

CREATE POLICY "College admins can manage receipts"
    ON public.receipts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            JOIN public.student_fees sf ON sf.id = p.student_fee_id
            WHERE p.id = payment_id
            AND sf.college_id = public.current_user_college_id()
        )
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
        )
    );
