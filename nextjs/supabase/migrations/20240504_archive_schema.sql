-- 1. Create Archive Summary Table
CREATE TABLE IF NOT EXISTS commission_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filename TEXT NOT NULL,
    total_commission NUMERIC DEFAULT 0,
    total_supervisors_commission NUMERIC DEFAULT 0
);

-- 2. Create Archive Items Table (Details)
CREATE TABLE IF NOT EXISTS commission_archive_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID REFERENCES commission_archives(id) ON DELETE CASCADE,
    branch_name TEXT,
    sales_2024 NUMERIC,
    sales_2025 NUMERIC,
    growth NUMERIC,
    rate NUMERIC,
    commission NUMERIC,
    supervisor_names TEXT,
    supervisor_commission NUMERIC
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE commission_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_archive_items ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allowing all access for simplicity, or restricted to authenticated)
-- Using 'true' for check/using allows public access if no auth is set up, 
-- change 'true' to (auth.role() = 'authenticated') for more security.
CREATE POLICY "Enable all access for archives" ON commission_archives FOR ALL USING (true);
CREATE POLICY "Enable all access for archive items" ON commission_archive_items FOR ALL USING (true);
