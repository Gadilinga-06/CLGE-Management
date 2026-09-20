-- Phase 11: Library Management Enhancements

-- 1. Enhance books table with edition, quantity, and update_at
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS edition VARCHAR(50);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_copies INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add college_id to library_members for RLS
ALTER TABLE public.library_members ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- 3. Add college_id to library_transactions for fast filtering
ALTER TABLE public.library_transactions ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- 4. Add notes / renewal tracking to transactions
ALTER TABLE public.library_transactions ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0;
ALTER TABLE public.library_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Add college_id to library_fines
ALTER TABLE public.library_fines ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- 6. Book reservations table
CREATE TABLE IF NOT EXISTS public.book_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FULFILLED, CANCELLED, EXPIRED
    UNIQUE(book_id, member_id, status)
);

-- 7. Fine configuration table
CREATE TABLE IF NOT EXISTS public.library_fine_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    fine_per_day DECIMAL(10,2) NOT NULL DEFAULT 2.00,
    max_fine DECIMAL(10,2),
    grace_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id)
);

-- 8. Enable RLS on all library tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_fine_rules ENABLE ROW LEVEL SECURITY;

-- RLS: books
CREATE POLICY "Anyone in college can view books"
    ON public.books FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Librarian can manage books"
    ON public.books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: book_copies
CREATE POLICY "Anyone in college can view copies"
    ON public.book_copies FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id AND b.college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Librarian can manage copies"
    ON public.book_copies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: library_members
CREATE POLICY "Members can view own record"
    ON public.library_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

CREATE POLICY "Librarian can manage members"
    ON public.library_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: library_transactions
CREATE POLICY "Members can view own transactions"
    ON public.library_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.library_members lm WHERE lm.id = member_id AND lm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

CREATE POLICY "Librarian can manage transactions"
    ON public.library_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: library_fines
CREATE POLICY "Members can view own fines"
    ON public.library_fines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.library_transactions lt
            JOIN public.library_members lm ON lt.member_id = lm.id
            WHERE lt.id = transaction_id AND lm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

CREATE POLICY "Librarian can manage fines"
    ON public.library_fines FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: book_reservations
CREATE POLICY "Members can view own reservations"
    ON public.book_reservations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.library_members lm WHERE lm.id = member_id AND lm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

CREATE POLICY "Anyone in college can insert reservations"
    ON public.book_reservations FOR INSERT
    WITH CHECK (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Members can cancel own reservations"
    ON public.book_reservations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.library_members lm WHERE lm.id = member_id AND lm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- RLS: fine rules
CREATE POLICY "Anyone can view fine rules"
    ON public.library_fine_rules FOR SELECT
    USING (college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Librarian can manage fine rules"
    ON public.library_fine_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'LIBRARIAN')
        )
    );

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_books_college_id ON public.books(college_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON public.book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_status ON public.book_copies(status);
CREATE INDEX IF NOT EXISTS idx_lib_trans_member_id ON public.library_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_lib_trans_status ON public.library_transactions(status);
CREATE INDEX IF NOT EXISTS idx_lib_reservations_book_id ON public.book_reservations(book_id);
