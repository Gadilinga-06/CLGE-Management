-- Phase 12: Hostel Fee Integration & RLS Fixes

-- 1. Link student_fees to hostel allocations
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS hostel_allocation_id UUID REFERENCES public.hostel_allocations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_fees_hostel_allocation ON public.student_fees(hostel_allocation_id);

-- 2. Fix RLS: complaint INSERT must verify student_id ownership
DROP POLICY IF EXISTS "Students can create hostel complaints" ON public.hostel_complaints;

CREATE POLICY "Students can create hostel complaints"
    ON public.hostel_complaints FOR INSERT
    WITH CHECK (
        college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
        AND student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
    );

-- 3. Add hostel_allocation_id to audit context (no schema change, just comment)
-- The allocateBed/vacateBed/transferBed actions now log bed status changes to audit_logs
