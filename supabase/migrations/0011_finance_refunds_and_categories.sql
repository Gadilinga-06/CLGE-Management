-- Phase 10: Fees & Finance - Refunds and Categories
-- 1. Add semester_id and student_category to fee_structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS student_category VARCHAR(100);

-- 2. Create refunds table
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update student_fees to support refunded tracking (optional, but paid_amount will be adjusted dynamically)
-- We will just adjust paid_amount and status on student_fees when a refund occurs.

-- 4. RLS for Refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own refunds"
    ON public.refunds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            JOIN public.students s ON s.id = p.student_id
            WHERE p.id = payment_id AND s.user_id = auth.uid()
        ) OR
        (
            college_id = public.current_user_college_id()
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
            )
        )
    );

CREATE POLICY "College admins can manage refunds"
    ON public.refunds FOR ALL
    USING (
        college_id = public.current_user_college_id()
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT')
        )
    );
