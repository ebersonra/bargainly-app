
-- ⚠️ Substitua o UUID abaixo pelo user_id correto
-- Exemplo: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

UPDATE products SET user_id = '04836202-799a-4137-9796-b7815ab6e314' WHERE user_id IS NULL;
UPDATE markets SET user_id = '04836202-799a-4137-9796-b7815ab6e314' WHERE user_id IS NULL;
UPDATE company_cache SET user_id = '04836202-799a-4137-9796-b7815ab6e314' WHERE user_id IS NULL;
