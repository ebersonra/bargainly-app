-- Shopping Lists Schema Migration
-- Data: 2025-09-05
-- Descrição: Criação das tabelas para sistema de listas de compras compartilháveis

-- 1. Tabela principal de listas de compras
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Usando TEXT conforme padrão do projeto
    title TEXT NOT NULL,
    description TEXT,
    shopping_date DATE NOT NULL DEFAULT CURRENT_DATE,
    market_id UUID REFERENCES markets(id),
    total_amount NUMERIC(10,2) DEFAULT 0.00,
    share_code TEXT NOT NULL UNIQUE, -- 4 primeiros dígitos do UUID
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 2. Tabela de itens da lista de compras
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'un', -- un, kg, g, l, ml, cx, pct
    unit_price NUMERIC(10,2) DEFAULT 0.00,
    total_price NUMERIC(10,2) DEFAULT 0.00,
    is_checked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Função para gerar share_code baseado nos primeiros 4 dígitos do UUID
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Gera 4 dígitos aleatórios
        new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Verifica se o código já existe
        SELECT EXISTS(SELECT 1 FROM shopping_lists WHERE share_code = new_code) INTO code_exists;
        
        -- Se não existe, retorna o código
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para auto-gerar share_code
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
        NEW.share_code := generate_share_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_share_code
    BEFORE INSERT ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION set_share_code();

-- 5. Trigger para atualizar updated_at
CREATE TRIGGER trg_set_updated_at_shopping_lists
    BEFORE UPDATE ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_shopping_list_items
    BEFORE UPDATE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 6. Função para calcular total da lista automaticamente
CREATE OR REPLACE FUNCTION update_shopping_list_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_lists 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM shopping_list_items 
        WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
    )
    WHERE id = COALESCE(NEW.list_id, OLD.list_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers para atualizar total da lista quando itens são modificados
CREATE TRIGGER trg_update_list_total_insert
    AFTER INSERT ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

CREATE TRIGGER trg_update_list_total_update
    AFTER UPDATE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

CREATE TRIGGER trg_update_list_total_delete
    AFTER DELETE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_share_code ON shopping_lists(share_code);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_shopping_date ON shopping_lists(shopping_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);

-- 9. Views para facilitar consultas
CREATE OR REPLACE VIEW active_shopping_lists AS
SELECT 
    sl.*,
    m.name as market_name,
    m.address as market_address,
    (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id) as items_count,
    (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id AND is_checked = true) as checked_items_count
FROM shopping_lists sl
LEFT JOIN markets m ON sl.market_id = m.id
WHERE sl.deleted_at IS NULL
ORDER BY sl.created_at DESC;

-- 10. View para itens agrupados por categoria
CREATE OR REPLACE VIEW shopping_list_items_by_category AS
SELECT 
    sli.*,
    sl.title as list_title,
    sl.share_code,
    sl.user_id as list_user_id
FROM shopping_list_items sli
JOIN shopping_lists sl ON sli.list_id = sl.id
WHERE sl.deleted_at IS NULL
ORDER BY sli.category ASC, sli.unit_price ASC;

-- 11. Função para buscar lista por código compartilhado
CREATE OR REPLACE FUNCTION get_shopping_list_by_code(p_share_code TEXT)
RETURNS TABLE(
    list_data jsonb,
    items_data jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        row_to_json(sl)::jsonb as list_data,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', sli.id,
                    'product_name', sli.product_name,
                    'category', sli.category,
                    'quantity', sli.quantity,
                    'unit', sli.unit,
                    'unit_price', sli.unit_price,
                    'total_price', sli.total_price,
                    'is_checked', sli.is_checked,
                    'notes', sli.notes
                ) ORDER BY sli.category, sli.unit_price
            ) FILTER (WHERE sli.id IS NOT NULL),
            '[]'::json
        )::jsonb as items_data
    FROM active_shopping_lists sl
    LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
    WHERE sl.share_code = p_share_code
    GROUP BY sl.id, sl.user_id, sl.title, sl.description, sl.shopping_date, 
             sl.market_id, sl.total_amount, sl.share_code, sl.is_completed,
             sl.created_at, sl.updated_at, sl.deleted_at, sl.market_name, 
             sl.market_address, sl.items_count, sl.checked_items_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para criar lista de compras
CREATE OR REPLACE FUNCTION create_shopping_list(
    p_user_id TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_shopping_date DATE DEFAULT CURRENT_DATE,
    p_market_id UUID DEFAULT NULL
) RETURNS shopping_lists AS $$
DECLARE
    v_list shopping_lists;
BEGIN
    INSERT INTO shopping_lists (user_id, title, description, shopping_date, market_id)
    VALUES (p_user_id, p_title, p_description, p_shopping_date, p_market_id)
    RETURNING * INTO v_list;
    
    RETURN v_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Função para adicionar item à lista
CREATE OR REPLACE FUNCTION add_shopping_list_item(
    p_list_id UUID,
    p_product_name TEXT,
    p_category TEXT,
    p_quantity NUMERIC DEFAULT 1,
    p_unit TEXT DEFAULT 'un',
    p_unit_price NUMERIC DEFAULT 0.00,
    p_notes TEXT DEFAULT NULL
) RETURNS shopping_list_items AS $$
DECLARE
    v_item shopping_list_items;
    v_total_price NUMERIC;
BEGIN
    -- Calcula o preço total
    v_total_price := p_quantity * p_unit_price;
    
    INSERT INTO shopping_list_items (
        list_id, product_name, category, quantity, unit, unit_price, total_price, notes
    )
    VALUES (
        p_list_id, p_product_name, p_category, p_quantity, p_unit, p_unit_price, v_total_price, p_notes
    )
    RETURNING * INTO v_item;
    
    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Seeds com dados de exemplo
INSERT INTO shopping_lists (user_id, title, description, shopping_date, share_code) 
VALUES 
    ('demo_user', 'Lista de Compras - Supermercado', 'Compras da semana no supermercado', CURRENT_DATE, '1234'),
    ('demo_user', 'Lista de Compras - Açougue', 'Carnes para o churrasco do final de semana', CURRENT_DATE + 1, '5678')
ON CONFLICT (share_code) DO NOTHING;

-- Inserir itens de exemplo
DO $$
DECLARE
    v_list_id UUID;
BEGIN
    -- Lista do supermercado
    SELECT id INTO v_list_id FROM shopping_lists WHERE share_code = '1234';
    IF v_list_id IS NOT NULL THEN
        INSERT INTO shopping_list_items (list_id, product_name, category, quantity, unit, unit_price, total_price) VALUES
            (v_list_id, 'Arroz Branco 5kg', 'Cereais e Grãos', 1, 'pct', 15.90, 15.90),
            (v_list_id, 'Feijão Preto 1kg', 'Cereais e Grãos', 2, 'pct', 7.50, 15.00),
            (v_list_id, 'Óleo de Soja 900ml', 'Mercearia', 1, 'un', 4.99, 4.99),
            (v_list_id, 'Leite Integral 1L', 'Laticínios', 3, 'un', 4.20, 12.60),
            (v_list_id, 'Pão Francês', 'Padaria', 0.5, 'kg', 12.00, 6.00);
    END IF;
    
    -- Lista do açougue  
    SELECT id INTO v_list_id FROM shopping_lists WHERE share_code = '5678';
    IF v_list_id IS NOT NULL THEN
        INSERT INTO shopping_list_items (list_id, product_name, category, quantity, unit, unit_price, total_price) VALUES
            (v_list_id, 'Picanha Premium', 'Açougue', 1.5, 'kg', 65.00, 97.50),
            (v_list_id, 'Linguiça Toscana', 'Açougue', 0.8, 'kg', 28.00, 22.40),
            (v_list_id, 'Costela Bovina', 'Açougue', 2.0, 'kg', 35.00, 70.00);
    END IF;
END $$;
