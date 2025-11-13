-- Atualizar função insert_purchase_record para incluir description
-- Data: 2025-08-23

-- Function to insert a validated purchase record with description
CREATE OR REPLACE FUNCTION insert_purchase_record(
  p_user_id uuid,
  p_category text,
  p_value numeric,
  p_source text,
  p_date date,
  p_description text DEFAULT NULL
) RETURNS purchase_records AS $$
DECLARE
  v_category_id uuid;
  v_record purchase_records;
BEGIN
  SELECT id INTO v_category_id
  FROM purchase_categories
  WHERE name = p_category AND user_id = p_user_id;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category % not found for user %', p_category, p_user_id;
  END IF;

  INSERT INTO purchase_records (user_id, category_id, value, source, purchase_date, description)
  VALUES (p_user_id, v_category_id, p_value, p_source, p_date, p_description)
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
