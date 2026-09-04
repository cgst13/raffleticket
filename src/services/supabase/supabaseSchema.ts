/**
 * Complete SQL DDL Schema for Supabase
 * You can execute this script directly in the Supabase SQL Editor to initialize all tables,
 * indexes, and enable Realtime replication.
 */
export const SUPABASE_SQL_SCHEMA = `-- ════════════════════════════════════════════════════════════════
-- TICKET PRO / RAFFLE PRO - SUPABASE DATABASE SCHEMA
-- ════════════════════════════════════════════════════════════════

-- 1. RAFFLES TABLE
CREATE TABLE IF NOT EXISTS public.raffles (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    raffle_name TEXT NOT NULL,
    ticket_name TEXT NOT NULL DEFAULT 'General Admission',
    ticket_amount NUMERIC NOT NULL DEFAULT 0,
    draw_date TEXT NOT NULL,
    draw_time TEXT,
    venue TEXT,
    description TEXT,
    managers JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TICKET DESIGNS TABLE
CREATE TABLE IF NOT EXISTS public.ticket_designs (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    width_mm NUMERIC NOT NULL DEFAULT 140,
    height_mm NUMERIC NOT NULL DEFAULT 50,
    background_image_url TEXT,
    background_color TEXT DEFAULT '#FFFFFF',
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRINT LAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.print_layouts (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    paper_size TEXT NOT NULL DEFAULT 'Folio',
    orientation TEXT NOT NULL DEFAULT 'portrait',
    margins JSONB NOT NULL DEFAULT '{"top":5,"bottom":5,"left":5,"right":5}'::jsonb,
    ticket_width_mm NUMERIC NOT NULL DEFAULT 140,
    ticket_height_mm NUMERIC NOT NULL DEFAULT 50,
    tickets_per_row INTEGER NOT NULL DEFAULT 1,
    rows_per_page INTEGER NOT NULL DEFAULT 5,
    vertical_gap_mm NUMERIC NOT NULL DEFAULT 3,
    horizontal_gap_mm NUMERIC NOT NULL DEFAULT 0,
    show_crop_marks BOOLEAN NOT NULL DEFAULT false,
    show_ticket_borders BOOLEAN NOT NULL DEFAULT true,
    show_page_numbers BOOLEAN NOT NULL DEFAULT true,
    show_booklet_number BOOLEAN NOT NULL DEFAULT false,
    show_print_guides BOOLEAN NOT NULL DEFAULT true,
    calibration JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRINT SETS TABLE
CREATE TABLE IF NOT EXISTS public.print_sets (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL DEFAULT 1,
    starting_ticket_number TEXT NOT NULL,
    ending_ticket_number TEXT NOT NULL,
    starting_sequence INTEGER NOT NULL,
    ending_sequence INTEGER NOT NULL,
    tickets_per_booklet INTEGER NOT NULL DEFAULT 10,
    total_booklets INTEGER NOT NULL DEFAULT 5,
    total_tickets INTEGER NOT NULL DEFAULT 50,
    total_pages INTEGER NOT NULL DEFAULT 10,
    booklets_per_row INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'generated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BOOKLETS TABLE
CREATE TABLE IF NOT EXISTS public.booklets (
    id TEXT PRIMARY KEY,
    print_set_id TEXT NOT NULL REFERENCES public.print_sets(id) ON DELETE CASCADE,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    booklet_number INTEGER NOT NULL,
    starting_ticket_number TEXT NOT NULL,
    ending_ticket_number TEXT NOT NULL,
    starting_sequence INTEGER NOT NULL,
    ending_sequence INTEGER NOT NULL,
    total_tickets INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'available',
    solicitor_name TEXT,
    buyer_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    print_set_id TEXT NOT NULL REFERENCES public.print_sets(id) ON DELETE CASCADE,
    booklet_id TEXT NOT NULL REFERENCES public.booklets(id) ON DELETE CASCADE,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    ticket_sequence INTEGER NOT NULL,
    qr_value TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    buyer_name TEXT,
    solicitor_name TEXT,
    assigned_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'other',
    date TEXT NOT NULL,
    receipt_number TEXT,
    notes TEXT,
    recorded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MANAGERS TABLE
CREATE TABLE IF NOT EXISTS public.managers (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'manager',
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    organization_name TEXT DEFAULT 'Raffle Pro Organization',
    contact_email TEXT DEFAULT '',
    default_currency TEXT DEFAULT 'PHP',
    default_paper_size TEXT DEFAULT 'Folio',
    default_margins JSONB DEFAULT '{"top":5,"bottom":5,"left":5,"right":5}'::jsonb,
    sync_status TEXT DEFAULT 'synced',
    backup_frequency TEXT DEFAULT 'weekly',
    theme_mode TEXT DEFAULT 'light',
    audit_logs_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NAMES HISTORY TABLE (For Buyer & Solicitor Auto-Suggest)
CREATE TABLE IF NOT EXISTS public.names_history (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'both',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. USERS TABLE (Accounts & Authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    raffle_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- INDEXES FOR HIGH PERFORMANCE QUERYING
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_ticket_designs_raffle ON public.ticket_designs(raffle_id);
CREATE INDEX IF NOT EXISTS idx_print_layouts_raffle ON public.print_layouts(raffle_id);
CREATE INDEX IF NOT EXISTS idx_print_sets_raffle ON public.print_sets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_booklets_raffle ON public.booklets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_booklets_print_set ON public.booklets(print_set_id);
CREATE INDEX IF NOT EXISTS idx_tickets_raffle ON public.tickets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booklet ON public.tickets(booklet_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sequence ON public.tickets(raffle_id, ticket_sequence);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON public.tickets(raffle_id, ticket_number);
CREATE INDEX IF NOT EXISTS idx_expenses_raffle ON public.expenses(raffle_id);
CREATE INDEX IF NOT EXISTS idx_managers_raffle ON public.managers(raffle_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY & OPEN POLICIES (ANON ACCESS)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booklets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.names_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Full Access on raffles" ON public.raffles;
    CREATE POLICY "Public Full Access on raffles" ON public.raffles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on ticket_designs" ON public.ticket_designs;
    CREATE POLICY "Public Full Access on ticket_designs" ON public.ticket_designs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on print_layouts" ON public.print_layouts;
    CREATE POLICY "Public Full Access on print_layouts" ON public.print_layouts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on print_sets" ON public.print_sets;
    CREATE POLICY "Public Full Access on print_sets" ON public.print_sets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on booklets" ON public.booklets;
    CREATE POLICY "Public Full Access on booklets" ON public.booklets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on tickets" ON public.tickets;
    CREATE POLICY "Public Full Access on tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on expenses" ON public.expenses;
    CREATE POLICY "Public Full Access on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on managers" ON public.managers;
    CREATE POLICY "Public Full Access on managers" ON public.managers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on app_settings" ON public.app_settings;
    CREATE POLICY "Public Full Access on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on names_history" ON public.names_history;
    CREATE POLICY "Public Full Access on names_history" ON public.names_history FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on users" ON public.users;
    CREATE POLICY "Public Full Access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ════════════════════════════════════════════════════════════════
-- ENABLE REALTIME REPLICATION FOR LIVE SYNC
-- ════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.raffles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booklets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.managers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
`;
