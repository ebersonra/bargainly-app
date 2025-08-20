-- 📦 Tabela de categorias de compra
CREATE TABLE IF NOT EXISTS purchase_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- ex: "mercado", "açougue", "hortifrúti"
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 🎯 Tabela de metas mensais
CREATE TABLE IF NOT EXISTS budget_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- formato: '2025-08'
    category_id UUID REFERENCES purchase_categories(id),
    target_value NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 🧾 Tabela de compras registradas (manual ou via OCR)
CREATE TABLE IF NOT EXISTS purchase_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES purchase_categories(id),
    description TEXT,
    value NUMERIC NOT NULL,
    source TEXT, -- "manual" | "ocr"
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);