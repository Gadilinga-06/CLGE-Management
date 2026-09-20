-- Phase 10: Late Fee Configuration & Refund Enhancements

-- 1. Add late fee configuration to fee_structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS late_fee_per_day DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS late_fee_max DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS grace_days INTEGER DEFAULT 0;

-- 2. Enhance refunds table with more detail
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT 'ORIGINAL';
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED';

-- 3. Add a payments index for faster date-range queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee_structure_id ON public.student_fees(fee_structure_id);
