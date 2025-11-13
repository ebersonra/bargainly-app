    -- Complete User Management and UUID Migration
    -- Data: 2025-09-12
    -- Descrição: Cria tabela de usuários e converte todas as referências user_id para UUID

    -- ===================================================================
    -- PARTE 1: CRIAR TABELA DE USUÁRIOS
    -- ===================================================================

    -- 1. Criar tabela de usuários
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- 2. Criar índices para performance
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

    -- 3. Trigger para atualizar updated_at
    CREATE TRIGGER trg_set_updated_at_users
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    -- 4. View para usuários ativos
    CREATE OR REPLACE VIEW active_users AS
    SELECT * FROM users 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC;

    -- 5. Função para criar usuário
    CREATE OR REPLACE FUNCTION create_user(
        p_name TEXT,
        p_phone TEXT,
        p_email TEXT DEFAULT NULL
    ) RETURNS users AS $$
    DECLARE
        v_user users;
    BEGIN
        -- Verificar se telefone já existe
        IF EXISTS(SELECT 1 FROM users WHERE phone = p_phone AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Telefone % já está cadastrado', p_phone;
        END IF;
        
        INSERT INTO users (name, phone, email)
        VALUES (p_name, p_phone, p_email)
        RETURNING * INTO v_user;
        
        RETURN v_user;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 6. Função para buscar usuário por telefone
    CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone TEXT)
    RETURNS users AS $$
    DECLARE
        v_user users;
    BEGIN
        SELECT * INTO v_user 
        FROM users 
        WHERE phone = p_phone AND deleted_at IS NULL;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Usuário com telefone % não encontrado', p_phone;
        END IF;
        
        RETURN v_user;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- ===================================================================
    -- PARTE 2: MIGRAR DADOS EXISTENTES
    -- ===================================================================

    -- 7. Verificar se existem dados nas tabelas antes da migração
    DO $$
    DECLARE
        shopping_lists_count INTEGER;
        purchase_records_count INTEGER;
        purchase_categories_count INTEGER;
        budget_goals_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO shopping_lists_count FROM shopping_lists;
        SELECT COUNT(*) INTO purchase_records_count FROM purchase_records;
        SELECT COUNT(*) INTO purchase_categories_count FROM purchase_categories;
        SELECT COUNT(*) INTO budget_goals_count FROM budget_goals;
        
        RAISE NOTICE 'Found % shopping_lists records', shopping_lists_count;
        RAISE NOTICE 'Found % purchase_records records', purchase_records_count;
        RAISE NOTICE 'Found % purchase_categories records', purchase_categories_count;
        RAISE NOTICE 'Found % budget_goals records', budget_goals_count;
    END $$;

    -- 8. Criar usuários para todos os user_ids existentes
    DO $$
    DECLARE
        user_id_record RECORD;
        counter INTEGER := 1;
        unique_phone TEXT;
    BEGIN
        -- Criar usuário padrão do sistema
        INSERT INTO users (id, name, phone, email) 
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Sistema',
            'sistema',
            'sistema@bargainly.app'
        ) 
        ON CONFLICT (phone) DO NOTHING;
        
        -- Encontrar todos os user_ids únicos nas tabelas existentes
        FOR user_id_record IN (
            SELECT DISTINCT 
                CASE 
                    WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                    THEN user_id::UUID
                    ELSE '00000000-0000-0000-0000-000000000001'::UUID
                END as uuid_user_id,
                user_id as original_user_id
            FROM (
                SELECT user_id::TEXT as user_id FROM shopping_lists WHERE user_id IS NOT NULL
                UNION
                SELECT user_id::TEXT as user_id FROM purchase_records WHERE user_id IS NOT NULL
                UNION
                SELECT user_id::TEXT as user_id FROM purchase_categories WHERE user_id IS NOT NULL
                UNION
                SELECT user_id::TEXT as user_id FROM budget_goals WHERE user_id IS NOT NULL
            ) all_user_ids
            WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND user_id != '00000000-0000-0000-0000-000000000001'
        ) LOOP
            -- Gerar telefone único para cada usuário
            unique_phone := 'user_' || REPLACE(user_id_record.uuid_user_id::TEXT, '-', '');
            
        -- Inserir usuário se não existir
        INSERT INTO users (id, name, phone, email) 
        VALUES (
            user_id_record.uuid_user_id,
            'Usuário Migrado ' || counter,
            unique_phone,
            unique_phone || '@bargainly.app'
        ) 
        ON CONFLICT (id) DO NOTHING;            counter := counter + 1;
            RAISE NOTICE 'Created user: % with phone: %', user_id_record.uuid_user_id, unique_phone;
        END LOOP;
        
        RAISE NOTICE 'Created % users from existing data', counter - 1;
    END $$;

    -- ===================================================================
    -- PARTE 3: CONVERTER TABELAS PARA UUID
    -- ===================================================================

    -- 9. Remover políticas RLS que dependem das colunas user_id
    DROP POLICY IF EXISTS "Users manage own shopping_lists" ON shopping_lists;
    DROP POLICY IF EXISTS "Users manage own purchase_categories" ON purchase_categories;
    DROP POLICY IF EXISTS "Users manage own budget_goals" ON budget_goals;
    DROP POLICY IF EXISTS "Users manage own purchase_records" ON purchase_records;

    -- 10. SHOPPING_LISTS: Remover views dependentes
    DROP VIEW IF EXISTS active_shopping_lists;
    DROP VIEW IF EXISTS shopping_list_items_by_category;
    DROP VIEW IF EXISTS monthly_budget_summary;
    DROP VIEW IF EXISTS weekly_budget_summary;

    -- 11. SHOPPING_LISTS: Adicionar coluna temporária
    ALTER TABLE shopping_lists ADD COLUMN user_id_temp UUID;

    -- 11. SHOPPING_LISTS: Converter dados existentes
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
            UPDATE shopping_lists SET user_id_temp = user_id;
            RAISE NOTICE 'shopping_lists.user_id is already UUID, copying values';
        ELSE
            -- Se é TEXT, converter com validação
            UPDATE shopping_lists 
            SET user_id_temp = CASE 
                WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN user_id::UUID
                ELSE '00000000-0000-0000-0000-000000000001'::UUID
            END;
            RAISE NOTICE 'shopping_lists.user_id converted from % to UUID', user_id_data_type;
        END IF;
    END $$;

    -- 12. SHOPPING_LISTS: Remover coluna antiga e renomear
    ALTER TABLE shopping_lists DROP COLUMN user_id;
    ALTER TABLE shopping_lists RENAME COLUMN user_id_temp TO user_id;
    ALTER TABLE shopping_lists ALTER COLUMN user_id SET NOT NULL;

    -- 13. SHOPPING_LISTS: Adicionar foreign key para users
    ALTER TABLE shopping_lists 
    ADD CONSTRAINT fk_shopping_lists_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id);

    -- 14. PURCHASE_CATEGORIES: Converter para UUID
    ALTER TABLE purchase_categories ADD COLUMN user_id_temp UUID;

    DO $$
    DECLARE
        user_id_data_type TEXT;
    BEGIN
        SELECT data_type INTO user_id_data_type 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_categories' AND column_name = 'user_id';
        
        IF user_id_data_type = 'uuid' THEN
            UPDATE purchase_categories SET user_id_temp = user_id;
            RAISE NOTICE 'purchase_categories.user_id is already UUID, copying values';
        ELSE
            UPDATE purchase_categories 
            SET user_id_temp = CASE 
                WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN user_id::UUID
                ELSE '00000000-0000-0000-0000-000000000001'::UUID
            END;
            RAISE NOTICE 'purchase_categories.user_id converted from % to UUID', user_id_data_type;
        END IF;
    END $$;

    ALTER TABLE purchase_categories DROP COLUMN user_id;
    ALTER TABLE purchase_categories RENAME COLUMN user_id_temp TO user_id;
    ALTER TABLE purchase_categories ALTER COLUMN user_id SET NOT NULL;

    ALTER TABLE purchase_categories 
    ADD CONSTRAINT fk_purchase_categories_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id);

    -- 15. BUDGET_GOALS: Converter para UUID
    ALTER TABLE budget_goals ADD COLUMN user_id_temp UUID;

    DO $$
    DECLARE
        user_id_data_type TEXT;
    BEGIN
        SELECT data_type INTO user_id_data_type 
        FROM information_schema.columns 
        WHERE table_name = 'budget_goals' AND column_name = 'user_id';
        
        IF user_id_data_type = 'uuid' THEN
            UPDATE budget_goals SET user_id_temp = user_id;
            RAISE NOTICE 'budget_goals.user_id is already UUID, copying values';
        ELSE
            UPDATE budget_goals 
            SET user_id_temp = CASE 
                WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN user_id::UUID
                ELSE '00000000-0000-0000-0000-000000000001'::UUID
            END;
            RAISE NOTICE 'budget_goals.user_id converted from % to UUID', user_id_data_type;
        END IF;
    END $$;

    ALTER TABLE budget_goals DROP COLUMN user_id;
    ALTER TABLE budget_goals RENAME COLUMN user_id_temp TO user_id;
    ALTER TABLE budget_goals ALTER COLUMN user_id SET NOT NULL;

    ALTER TABLE budget_goals 
    ADD CONSTRAINT fk_budget_goals_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id);

    -- 16. PURCHASE_RECORDS: Converter para UUID
    ALTER TABLE purchase_records ADD COLUMN user_id_temp UUID;

    DO $$
    DECLARE
        user_id_data_type TEXT;
    BEGIN
        SELECT data_type INTO user_id_data_type 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_records' AND column_name = 'user_id';
        
        IF user_id_data_type = 'uuid' THEN
            UPDATE purchase_records SET user_id_temp = user_id;
            RAISE NOTICE 'purchase_records.user_id is already UUID, copying values';
        ELSE
            UPDATE purchase_records 
            SET user_id_temp = CASE 
                WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN user_id::UUID
                ELSE '00000000-0000-0000-0000-000000000001'::UUID
            END;
            RAISE NOTICE 'purchase_records.user_id converted from % to UUID', user_id_data_type;
        END IF;
    END $$;

    ALTER TABLE purchase_records DROP COLUMN user_id;
    ALTER TABLE purchase_records RENAME COLUMN user_id_temp TO user_id;
    ALTER TABLE purchase_records ALTER COLUMN user_id SET NOT NULL;

    ALTER TABLE purchase_records 
    ADD CONSTRAINT fk_purchase_records_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id);

    -- ===================================================================
    -- PARTE 4: RECRIAR ÍNDICES E VIEWS
    -- ===================================================================

    -- 17. Criar índices para performance
    CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id_uuid ON shopping_lists(user_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_categories_user_id_uuid ON purchase_categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_budget_goals_user_id_uuid ON budget_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_records_user_id_uuid ON purchase_records(user_id);

    -- 18. Recriar views
    CREATE OR REPLACE VIEW active_shopping_lists AS
    SELECT 
        sl.*,
        u.name as user_name,
        u.phone as user_phone,
        m.name as market_name,
        m.address as market_address,
        (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id) as items_count,
        (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id AND is_checked = true) as checked_items_count
    FROM shopping_lists sl
    LEFT JOIN users u ON sl.user_id = u.id
    LEFT JOIN markets m ON sl.market_id = m.id
    WHERE sl.deleted_at IS NULL
    ORDER BY sl.created_at DESC;

    CREATE OR REPLACE VIEW shopping_list_items_by_category AS
    SELECT 
        sli.*,
        sl.title as list_title,
        sl.share_code,
        sl.user_id as list_user_id,
        u.name as user_name,
        u.phone as user_phone
    FROM shopping_list_items sli
    JOIN shopping_lists sl ON sli.list_id = sl.id
    LEFT JOIN users u ON sl.user_id = u.id
    WHERE sl.deleted_at IS NULL
    ORDER BY sli.category ASC, sli.unit_price ASC;

    -- Recriar views de budget
    CREATE OR REPLACE VIEW monthly_budget_summary AS
    SELECT 
        bg.user_id,
        u.name as user_name,
        u.phone as user_phone,
        bg.month,
        COUNT(bg.id) as categories_count,
        SUM(bg.target_value) as total_budget,
        COALESCE(SUM(pr_summary.spent), 0) as total_spent,
        SUM(bg.target_value) - COALESCE(SUM(pr_summary.spent), 0) as total_remaining
    FROM budget_goals bg
    LEFT JOIN users u ON bg.user_id = u.id
    LEFT JOIN (
        SELECT 
            pr.user_id,
            pc.id as category_id,
            TO_CHAR(pr.purchase_date, 'YYYY-MM') as month,
            SUM(pr.value) as spent
        FROM purchase_records pr
        JOIN purchase_categories pc ON pr.category_id = pc.id
        GROUP BY pr.user_id, pc.id, TO_CHAR(pr.purchase_date, 'YYYY-MM')
    ) pr_summary ON bg.user_id = pr_summary.user_id 
                 AND bg.category_id = pr_summary.category_id 
                 AND bg.month = pr_summary.month
    GROUP BY bg.user_id, u.name, u.phone, bg.month
    ORDER BY bg.month DESC;

    CREATE OR REPLACE VIEW weekly_budget_summary AS
    SELECT 
        bg.user_id,
        u.name as user_name,
        u.phone as user_phone,
        bg.month,
        EXTRACT(WEEK FROM CURRENT_DATE) as current_week,
        COUNT(bg.id) as categories_count,
        SUM(bg.target_value) / 4 as weekly_budget_estimate,
        COALESCE(SUM(pr_summary.spent), 0) as week_spent
    FROM budget_goals bg
    LEFT JOIN users u ON bg.user_id = u.id
    LEFT JOIN (
        SELECT 
            pr.user_id,
            pc.id as category_id,
            TO_CHAR(pr.purchase_date, 'YYYY-MM') as month,
            EXTRACT(WEEK FROM pr.purchase_date) as week,
            SUM(pr.value) as spent
        FROM purchase_records pr
        JOIN purchase_categories pc ON pr.category_id = pc.id
        WHERE EXTRACT(WEEK FROM pr.purchase_date) = EXTRACT(WEEK FROM CURRENT_DATE)
        GROUP BY pr.user_id, pc.id, TO_CHAR(pr.purchase_date, 'YYYY-MM'), EXTRACT(WEEK FROM pr.purchase_date)
    ) pr_summary ON bg.user_id = pr_summary.user_id 
                 AND bg.category_id = pr_summary.category_id 
                 AND bg.month = pr_summary.month
    WHERE bg.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    GROUP BY bg.user_id, u.name, u.phone, bg.month
    ORDER BY bg.user_id;

    -- ===================================================================
    -- PARTE 5: ATUALIZAR FUNÇÕES
    -- ===================================================================

    -- 19. Atualizar função create_shopping_list
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
        -- Verificar se usuário existe
        IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Usuário % não encontrado', p_user_id;
        END IF;
        
        INSERT INTO shopping_lists (user_id, title, description, shopping_date, market_id)
        VALUES (p_user_id, p_title, p_description, p_shopping_date, p_market_id)
        RETURNING * INTO v_list;
        
        RETURN v_list;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 20. Atualizar função get_shopping_list_by_code
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
                'user_name', u.name,
                'user_phone', u.phone,
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
        LEFT JOIN users u ON sl.user_id = u.id
        LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
        WHERE sl.share_code = p_share_code
        GROUP BY sl.id, sl.user_id, u.name, u.phone, sl.title, sl.description, sl.shopping_date, 
                sl.market_id, sl.market_name, sl.market_address, sl.total_amount, 
                sl.share_code, sl.is_completed, sl.items_count, sl.checked_items_count,
                sl.created_at, sl.updated_at, sl.deleted_at;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 21. Atualizar função insert_purchase_record
    CREATE OR REPLACE FUNCTION insert_purchase_record(
    p_user_id UUID,
    p_category TEXT,
    p_value NUMERIC,
    p_source TEXT DEFAULT 'manual',
    p_date DATE DEFAULT CURRENT_DATE,
    p_description TEXT DEFAULT NULL
    ) RETURNS purchase_records AS $$
    DECLARE
    v_category_id UUID;
    v_record purchase_records;
    BEGIN
    -- Verificar se usuário existe
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Usuário % não encontrado', p_user_id;
    END IF;
    
    -- Find or create category
    SELECT id INTO v_category_id
    FROM purchase_categories 
    WHERE name = p_category AND user_id = p_user_id;
    
    IF v_category_id IS NULL THEN
        INSERT INTO purchase_categories (name, user_id)
        VALUES (p_category, p_user_id)
        RETURNING id INTO v_category_id;
    END IF;

    -- Insert purchase record
    INSERT INTO purchase_records (user_id, category_id, value, source, purchase_date, description)
    VALUES (p_user_id, v_category_id, p_value, p_source, p_date, p_description)
    RETURNING * INTO v_record;

    RETURN v_record;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 22. Atualizar função get_budget_status
    CREATE OR REPLACE FUNCTION get_budget_status(p_user_id UUID, p_month TEXT)
    RETURNS TABLE(
    category TEXT,
    target_value NUMERIC,
    spent NUMERIC,
    remaining NUMERIC,
    spent_percentage NUMERIC
    ) AS $$
    BEGIN
    -- Verificar se usuário existe
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Usuário % não encontrado', p_user_id;
    END IF;
    
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

    -- ===================================================================
    -- PARTE 6: RECRIAR POLÍTICAS RLS
    -- ===================================================================

    -- 23. Recriar políticas RLS com as colunas UUID
    DO $$
    BEGIN
        -- Habilitar RLS nas tabelas se não estiver habilitado
        ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchase_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;
        
        -- Recriar políticas para shopping_lists
        CREATE POLICY "Users manage own shopping_lists" ON shopping_lists
            FOR ALL USING (user_id = auth.uid()::uuid);
        
        -- Recriar políticas para purchase_categories
        CREATE POLICY "Users manage own purchase_categories" ON purchase_categories
            FOR ALL USING (user_id = auth.uid()::uuid);
        
        -- Recriar políticas para budget_goals  
        CREATE POLICY "Users manage own budget_goals" ON budget_goals
            FOR ALL USING (user_id = auth.uid()::uuid);
        
        -- Recriar políticas para purchase_records
        CREATE POLICY "Users manage own purchase_records" ON purchase_records
            FOR ALL USING (user_id = auth.uid()::uuid);
            
        RAISE NOTICE 'RLS policies recreated successfully';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Some RLS policies already exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Note: RLS policies may need manual configuration in Supabase dashboard';
    END $$;

    -- ===================================================================
    -- PARTE 7: VERIFICAÇÃO FINAL
    -- ===================================================================

    -- 24. Verificação final
    DO $$
    DECLARE
        users_count INTEGER;
        shopping_lists_count INTEGER;
        purchase_records_count INTEGER;
        purchase_categories_count INTEGER;
        budget_goals_count INTEGER;
        uuid_checks_passed INTEGER := 0;
    BEGIN
        -- Contar registros
        SELECT COUNT(*) INTO users_count FROM users;
        SELECT COUNT(*) INTO shopping_lists_count FROM shopping_lists;
        SELECT COUNT(*) INTO purchase_records_count FROM purchase_records;
        SELECT COUNT(*) INTO purchase_categories_count FROM purchase_categories;
        SELECT COUNT(*) INTO budget_goals_count FROM budget_goals;
        
        -- Verificar se todas as colunas são UUID
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'user_id' AND data_type = 'uuid') THEN
            uuid_checks_passed := uuid_checks_passed + 1;
        END IF;
        
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_records' AND column_name = 'user_id' AND data_type = 'uuid') THEN
            uuid_checks_passed := uuid_checks_passed + 1;
        END IF;
        
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_categories' AND column_name = 'user_id' AND data_type = 'uuid') THEN
            uuid_checks_passed := uuid_checks_passed + 1;
        END IF;
        
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_goals' AND column_name = 'user_id' AND data_type = 'uuid') THEN
            uuid_checks_passed := uuid_checks_passed + 1;
        END IF;
        
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Users: %', users_count;
        RAISE NOTICE 'Shopping Lists: %', shopping_lists_count;
        RAISE NOTICE 'Purchase Records: %', purchase_records_count;
        RAISE NOTICE 'Purchase Categories: %', purchase_categories_count;
        RAISE NOTICE 'Budget Goals: %', budget_goals_count;
        RAISE NOTICE 'UUID Checks Passed: %/4', uuid_checks_passed;
        
        IF uuid_checks_passed = 4 THEN
            RAISE NOTICE 'SUCCESS: All user_id columns are now UUID type!';
        ELSE
            RAISE EXCEPTION 'FAILED: Some user_id columns are not UUID type';
        END IF;
    END $$;

    -- 24. Comentários de documentação
    COMMENT ON TABLE users IS 'Tabela de usuários do sistema com telefone único';
    COMMENT ON COLUMN users.phone IS 'Telefone único do usuário - usado como identificador de login';
    COMMENT ON COLUMN shopping_lists.user_id IS 'UUID do usuário proprietário da lista (referencia users.id)';
    COMMENT ON COLUMN purchase_records.user_id IS 'UUID do usuário proprietário do registro (referencia users.id)';
    COMMENT ON COLUMN purchase_categories.user_id IS 'UUID do usuário proprietário da categoria (referencia users.id)';
    COMMENT ON COLUMN budget_goals.user_id IS 'UUID do usuário proprietário da meta (referencia users.id)';
