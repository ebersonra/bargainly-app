-- Simple Shopping Lists user_id to UUID conversion only
-- Data: 2025-09-12
-- Descrição: Converte apenas shopping_lists.user_id de TEXT para UUID (versão simplificada)

-- Verificar se existem dados na tabela antes da migração
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM shopping_lists;
    RAISE NOTICE 'Found % records in shopping_lists table', record_count;
END $$;

-- 1. Verificar se todos os user_id são UUIDs válidos
DO $$
DECLARE
    invalid_count INTEGER;
    user_id_data_type TEXT;
BEGIN
    -- Verificar o tipo atual da coluna user_id
    SELECT data_type INTO user_id_data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shopping_lists' AND column_name = 'user_id';
    
    IF user_id_data_type = 'uuid' THEN
        -- Se já é UUID, não precisa validar
        RAISE NOTICE 'Column user_id is already UUID type. Skipping validation.';
        invalid_count := 0;
    ELSE
        -- Se é TEXT, validar se todos são UUIDs válidos
        SELECT COUNT(*) INTO invalid_count
        FROM shopping_lists 
        WHERE user_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    END IF;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid UUID values in user_id column. Migration aborted.', invalid_count;
    ELSE
        RAISE NOTICE 'All user_id values are valid UUIDs. Safe to proceed.';
    END IF;
END $$;

-- 2. Remover views dependentes antes de alterar a tabela
DROP VIEW IF EXISTS active_shopping_lists;
DROP VIEW IF EXISTS shopping_list_items_by_category;

-- 3. Criar coluna temporária para armazenar os UUIDs
ALTER TABLE shopping_lists ADD COLUMN user_id_temp UUID;

-- 4. Converter os valores para UUID na coluna temporária
DO $$
DECLARE
    user_id_data_type TEXT;
BEGIN
    -- Verificar o tipo atual da coluna user_id
    SELECT data_type INTO user_id_data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shopping_lists' AND column_name = 'user_id';
    
    IF user_id_data_type = 'uuid' THEN
        -- Se já é UUID, apenas copiar
        UPDATE shopping_lists SET user_id_temp = user_id WHERE user_id IS NOT NULL;
        RAISE NOTICE 'Column is already UUID, copied % values', ROW_COUNT;
    ELSE
        -- Se é TEXT, converter para UUID
        UPDATE shopping_lists SET user_id_temp = user_id::UUID WHERE user_id IS NOT NULL;
        RAISE NOTICE 'Converted % TEXT values to UUID', ROW_COUNT;
    END IF;
END $$;

-- 5. Verificar se a conversão foi bem-sucedida
DO $$
DECLARE
    conversion_count INTEGER;
    original_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM shopping_lists WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO conversion_count FROM shopping_lists WHERE user_id_temp IS NOT NULL;
    
    IF original_count != conversion_count THEN
        RAISE EXCEPTION 'Conversion failed: original=% converted=%', original_count, conversion_count;
    ELSE
        RAISE NOTICE 'Conversion successful: % records converted', conversion_count;
    END IF;
END $$;

-- 6. Remover a coluna original
ALTER TABLE shopping_lists DROP COLUMN user_id;

-- 7. Renomear a coluna temporária para user_id
ALTER TABLE shopping_lists RENAME COLUMN user_id_temp TO user_id;

-- 8. Adicionar constraint NOT NULL
ALTER TABLE shopping_lists ALTER COLUMN user_id SET NOT NULL;

-- 9. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id_uuid ON shopping_lists(user_id);

-- 10. Recriar as views que foram removidas
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

-- 11. Atualizar função create_shopping_list para aceitar UUID
CREATE OR REPLACE FUNCTION create_shopping_list(
    p_user_id UUID,
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

-- 12. Atualizar função get_shopping_list_by_code
CREATE OR REPLACE FUNCTION get_shopping_list_by_code(p_share_code TEXT)
RETURNS TABLE(
    list_data jsonb,
    items_data jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        json_build_object(
            'id', sl.id,
            'user_id', sl.user_id,
            'title', sl.title,
            'description', sl.description,
            'shopping_date', sl.shopping_date,
            'market_id', sl.market_id,
            'market_name', sl.market_name,
            'market_address', sl.market_address,
            'total_amount', sl.total_amount,
            'share_code', sl.share_code,
            'is_completed', sl.is_completed,
            'items_count', sl.items_count,
            'checked_items_count', sl.checked_items_count,
            'created_at', sl.created_at,
            'updated_at', sl.updated_at,
            'deleted_at', sl.deleted_at
        )::jsonb as list_data,
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
                    'notes', sli.notes,
                    'created_at', sli.created_at,
                    'updated_at', sli.updated_at
                ) ORDER BY sli.category, sli.unit_price
            ) FILTER (WHERE sli.id IS NOT NULL),
            '[]'::json
        )::jsonb as items_data
    FROM active_shopping_lists sl
    LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
    WHERE sl.share_code = p_share_code
    GROUP BY sl.id, sl.user_id, sl.title, sl.description, sl.shopping_date, 
             sl.market_id, sl.market_name, sl.market_address, sl.total_amount, 
             sl.share_code, sl.is_completed, sl.items_count, sl.checked_items_count,
             sl.created_at, sl.updated_at, sl.deleted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Verificação final
DO $$
DECLARE
    final_count INTEGER;
    uuid_type_check BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_lists' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) INTO uuid_type_check;
    
    SELECT COUNT(*) INTO final_count FROM shopping_lists;
    
    IF uuid_type_check THEN
        RAISE NOTICE 'SUCCESS: shopping_lists.user_id is now UUID type with % records', final_count;
    ELSE
        RAISE EXCEPTION 'FAILED: shopping_lists.user_id is not UUID type';
    END IF;
END $$;

-- 14. Comentário de documentação
COMMENT ON COLUMN shopping_lists.user_id IS 'UUID do usuário proprietário da lista de compras (convertido de TEXT para UUID em 2025-09-12)';
