
-- 🧩 Adiciona coluna de controle de usuário
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE company_cache ADD COLUMN IF NOT EXISTS user_id UUID;

-- 🔐 Habilita RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_cache ENABLE ROW LEVEL SECURITY;

-- 📄 RLS para tabela products
CREATE POLICY "Select own products" ON products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own products" ON products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own products" ON products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own products" ON products FOR DELETE USING (user_id = auth.uid());

-- 📄 RLS para tabela markets
CREATE POLICY "Select own markets" ON markets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own markets" ON markets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own markets" ON markets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own markets" ON markets FOR DELETE USING (user_id = auth.uid());

-- 📄 RLS para tabela company_cache
CREATE POLICY "Select own company_cache" ON company_cache FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own company_cache" ON company_cache FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own company_cache" ON company_cache FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own company_cache" ON company_cache FOR DELETE USING (user_id = auth.uid());
