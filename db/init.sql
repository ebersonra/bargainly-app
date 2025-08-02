-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABLE: markets
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT current_timestamp,
  updated_at TIMESTAMPTZ DEFAULT current_timestamp,
  deleted_at TIMESTAMPTZ
);

-- TABLE: products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  price NUMERIC(10,2),
  category TEXT,
  gtin TEXT,
  thumbnail TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT current_timestamp,
  updated_at TIMESTAMPTZ DEFAULT current_timestamp,
  deleted_at TIMESTAMPTZ
);

-- FUNCTION: update 'updated_at' on change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS to set updated_at automatically
CREATE TRIGGER trg_set_updated_at_markets
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- VIEWS to show only non-deleted records
CREATE OR REPLACE VIEW active_markets AS
SELECT * FROM markets
WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_products AS
SELECT * FROM products
WHERE deleted_at IS NULL;

-- ENABLE RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: SELECT (only non-deleted)
CREATE POLICY "Allow select on active markets"
  ON markets
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Allow select on active products"
  ON products
  FOR SELECT
  USING (deleted_at IS NULL);

-- RLS POLICIES: UPDATE (only non-deleted)
CREATE POLICY "Allow update on active markets"
  ON markets
  FOR UPDATE
  USING (deleted_at IS NULL);

CREATE POLICY "Allow update on active products"
  ON products
  FOR UPDATE
  USING (deleted_at IS NULL);

-- RLS POLICIES: INSERT (allow only if deleted_at IS NULL or not provided)
CREATE POLICY "Allow insert on markets"
  ON markets
  FOR INSERT
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Allow insert on products"
  ON products
  FOR INSERT
  WITH CHECK (deleted_at IS NULL);

-- RLS POLICIES: Soft delete (set deleted_at)
CREATE POLICY "Allow soft delete on markets"
  ON markets
  FOR UPDATE
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "Allow soft delete on products"
  ON products
  FOR UPDATE
  USING (deleted_at IS NULL)
  WITH CHECK (true);