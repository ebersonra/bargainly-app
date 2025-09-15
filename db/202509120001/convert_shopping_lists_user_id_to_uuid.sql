-- Convert shopping_lists.user_id from TEXT to UUID
-- Data: 2025-09-12
-- Descrição: Converte a coluna user_id da tabela shopping_lists de TEXT para UUID

-- Verificar se existem dados na tabela antes da migração
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM shopping_lists;
    RAISE NOTICE 'Found % records in shopping_lists table', record_count;
END $$;

-- 1. Primeiro, vamos verificar se todos os user_id são UUIDs válidos
-- Se houver valores que não são UUIDs válidos, a migração falhará
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Conta quantos user_id não são UUIDs válidos
    SELECT COUNT(*) INTO invalid_count
    FROM shopping_lists 
    WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid UUID values in user_id column. Migration aborted.', invalid_count;
    ELSE
        RAISE NOTICE 'All user_id values are valid UUIDs. Safe to proceed.';
    END IF;
END $$;

-- 2. Criar uma coluna temporária para armazenar os UUIDs
ALTER TABLE shopping_lists ADD COLUMN user_id_temp UUID;

-- 3. Converter os valores TEXT para UUID na coluna temporária
UPDATE shopping_lists 
SET user_id_temp = user_id::UUID 
WHERE user_id IS NOT NULL;

-- 4. Verificar se a conversão foi bem-sucedida
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

-- 5. Remover views que dependem da coluna user_id antes de fazer o drop
DROP VIEW IF EXISTS active_shopping_lists;
DROP VIEW IF EXISTS shopping_list_items_by_category;

-- 6. Remover a coluna original
ALTER TABLE shopping_lists DROP COLUMN user_id;

-- 7. Renomear a coluna temporária para user_id
ALTER TABLE shopping_lists RENAME COLUMN user_id_temp TO user_id;

-- 7. Adicionar constraint NOT NULL se necessário
ALTER TABLE shopping_lists ALTER COLUMN user_id SET NOT NULL;

-- 8. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id_uuid ON shopping_lists(user_id);

-- 9. Recriar as views que foram removidas
-- Recriar a view active_shopping_lists
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

-- Recriar a view shopping_list_items_by_category
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

-- 10. Atualizar as funções que usam user_id como TEXT
-- Função para criar lista de compras (agora aceita UUID)
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

-- 11. Verificação final
DO $$
DECLARE
    final_count INTEGER;
    uuid_type_check BOOLEAN;
BEGIN
    -- Verificar se a coluna agora é do tipo UUID
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopping_lists' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) INTO uuid_type_check;
    
    SELECT COUNT(*) INTO final_count FROM shopping_lists;
    
    IF uuid_type_check THEN
        RAISE NOTICE 'SUCCESS: user_id column is now UUID type with % records', final_count;
    ELSE
        RAISE EXCEPTION 'FAILED: user_id column is not UUID type';
    END IF;
END $$;

-- 12. Comentário de documentação
COMMENT ON COLUMN shopping_lists.user_id IS 'UUID do usuário proprietário da lista de compras (convertido de TEXT para UUID em 2025-09-12)';
