-- RLS policies for purchase_categories, budget_goals and purchase_records
ALTER TABLE purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own categories
CREATE POLICY "Users manage own purchase_categories" ON purchase_categories
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to manage only their own budget goals
CREATE POLICY "Users manage own budget_goals" ON budget_goals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to manage only their own purchase records
CREATE POLICY "Users manage own purchase_records" ON purchase_records
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Monthly comparison between goals and purchases
CREATE OR REPLACE VIEW monthly_budget_summary AS
SELECT
  bg.user_id,
  bg.month,
  pc.name AS category,
  bg.target_value AS budgeted,
  COALESCE(SUM(pr.value), 0) AS spent,
  bg.target_value - COALESCE(SUM(pr.value), 0) AS remaining,
  CASE WHEN bg.target_value = 0 THEN 0
       ELSE ROUND(COALESCE(SUM(pr.value), 0) / bg.target_value * 100, 2)
  END AS spent_percentage
FROM budget_goals bg
JOIN purchase_categories pc ON pc.id = bg.category_id
LEFT JOIN purchase_records pr
  ON pr.category_id = bg.category_id
 AND pr.user_id = bg.user_id
 AND TO_CHAR(pr.purchase_date, 'YYYY-MM') = bg.month
GROUP BY bg.user_id, bg.month, pc.name, bg.target_value;

-- Weekly comparison between goals and purchases
CREATE OR REPLACE VIEW weekly_budget_summary AS
SELECT
  bg.user_id,
  date_trunc('week', pr.purchase_date)::date AS week_start,
  pc.name AS category,
  bg.target_value AS budgeted,
  COALESCE(SUM(pr.value), 0) AS spent,
  bg.target_value - COALESCE(SUM(pr.value), 0) AS remaining,
  CASE WHEN bg.target_value = 0 THEN 0
       ELSE ROUND(COALESCE(SUM(pr.value), 0) / bg.target_value * 100, 2)
  END AS spent_percentage
FROM budget_goals bg
JOIN purchase_categories pc ON pc.id = bg.category_id
LEFT JOIN purchase_records pr
  ON pr.category_id = bg.category_id
 AND pr.user_id = bg.user_id
 AND TO_CHAR(pr.purchase_date, 'YYYY-MM') = bg.month
GROUP BY bg.user_id, week_start, pc.name, bg.target_value;

-- Function to get budget status
CREATE OR REPLACE FUNCTION get_budget_status(p_user_id uuid, p_month text)
RETURNS TABLE(
  category text,
  target_value numeric,
  spent numeric,
  remaining numeric,
  spent_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.name,
    bg.target_value,
    COALESCE(SUM(pr.value), 0) AS spent,
    bg.target_value - COALESCE(SUM(pr.value), 0) AS remaining,
    CASE WHEN bg.target_value = 0 THEN 0
         ELSE ROUND(COALESCE(SUM(pr.value), 0) / bg.target_value * 100, 2)
    END AS spent_percentage
  FROM budget_goals bg
  JOIN purchase_categories pc ON pc.id = bg.category_id
  LEFT JOIN purchase_records pr
    ON pr.category_id = bg.category_id
   AND pr.user_id = p_user_id
   AND TO_CHAR(pr.purchase_date, 'YYYY-MM') = p_month
  WHERE bg.user_id = p_user_id AND bg.month = p_month
  GROUP BY pc.name, bg.target_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert a validated purchase record
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
