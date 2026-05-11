-- Create master branches table
CREATE TABLE IF NOT EXISTS commission_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    normalized_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create master supervisors table
CREATE TABLE IF NOT EXISTS commission_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link table for assignments (Many-to-Many with share ratio)
CREATE TABLE IF NOT EXISTS commission_branch_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES commission_branches(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES commission_supervisors(id) ON DELETE CASCADE,
    share NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE commission_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_branch_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Access" ON commission_branches FOR ALL USING (true);
CREATE POLICY "Public Access" ON commission_supervisors FOR ALL USING (true);
CREATE POLICY "Public Access" ON commission_branch_assignments FOR ALL USING (true);

