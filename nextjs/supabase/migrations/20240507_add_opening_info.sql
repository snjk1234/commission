    -- Add opening day and month to branches
    ALTER TABLE commission_branches 
    ADD COLUMN IF NOT EXISTS opening_day INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS opening_month INTEGER DEFAULT NULL;

    -- Update commission_archive_items to store split sales if needed
    ALTER TABLE commission_archive_items
    ADD COLUMN IF NOT EXISTS split_sales_p1 NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT FALSE;
