-- Fix user_id columns to accept TEXT instead of UUID for custom authentication
-- This allows using custom user IDs like 'user_TIMESTAMP_RANDOM'

-- 1. Drop foreign key constraints that reference auth.users
ALTER TABLE purchase_categories DROP CONSTRAINT IF EXISTS purchase_categories_user_id_fkey;
ALTER TABLE budget_goals DROP CONSTRAINT IF EXISTS budget_goals_user_id_fkey;
ALTER TABLE purchase_records DROP CONSTRAINT IF EXISTS purchase_records_user_id_fkey;

-- 2. Change user_id column types from UUID to TEXT
ALTER TABLE purchase_categories ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE budget_goals ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE purchase_records ALTER COLUMN user_id TYPE TEXT;

-- 3. Update existing data if needed (convert any existing UUIDs to TEXT)
-- This is safe because PostgreSQL can automatically cast UUID to TEXT

-- 4. Add indexes for performance on the new TEXT columns
CREATE INDEX IF NOT EXISTS idx_purchase_categories_user_id ON purchase_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_user_id ON budget_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_user_id ON purchase_records(user_id);

-- 5. Update RLS policies to work with TEXT user_id
-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own purchase_categories" ON purchase_categories;
DROP POLICY IF EXISTS "Users manage own budget_goals" ON budget_goals;
DROP POLICY IF EXISTS "Users manage own purchase_records" ON purchase_records;

-- Create new policies that work with TEXT user_id
-- Note: Since we're not using auth.users anymore, we'll need to disable RLS 
-- or implement a custom authentication mechanism

-- For now, disable RLS to allow the app to work
ALTER TABLE purchase_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_records DISABLE ROW LEVEL SECURITY;

-- 6. Update any functions that might be using the old UUID type
-- We need to check and update the insert_purchase_record function

CREATE OR REPLACE FUNCTION insert_purchase_record(
  p_user_id TEXT,
  p_category TEXT,
  p_value NUMERIC,
  p_source TEXT DEFAULT 'manual',
  p_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL
) RETURNS purchase_records AS $$
DECLARE
  v_category_id UUID;
  v_record purchase_records;
BEGIN
  -- Find or create category
  SELECT id INTO v_category_id
  FROM purchase_categories 
  WHERE name = p_category AND user_id = p_user_id;
  
  IF v_category_id IS NULL THEN
    INSERT INTO purchase_categories (name, user_id)
    VALUES (p_category, p_user_id)
    RETURNING id INTO v_category_id;
  END IF;

  -- Insert purchase record
  INSERT INTO purchase_records (user_id, category_id, value, source, purchase_date, description)
  VALUES (p_user_id, v_category_id, p_value, p_source, p_date, p_description)
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql;
