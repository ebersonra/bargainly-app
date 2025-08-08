-- Seed default categories and initial budget goals
-- Replace <USER_ID> with a real user id before executing
INSERT INTO purchase_categories (name, user_id)
VALUES
  ('mercado', '<USER_ID>'),
  ('açougue', '<USER_ID>'),
  ('hortifrúti', '<USER_ID>');

INSERT INTO budget_goals (user_id, month, category_id, target_value)
SELECT
  '<USER_ID>' AS user_id,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS month,
  pc.id,
  vals.target_value
FROM (VALUES
  ('mercado', 1200),
  ('açougue', 400)
) AS vals(category_name, target_value)
JOIN purchase_categories pc
  ON pc.name = vals.category_name AND pc.user_id = '<USER_ID>';
