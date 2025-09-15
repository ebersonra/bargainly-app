-- Fix GROUP BY issue in get_shopping_list_by_code function
-- Data: 2025-09-11
-- Descrição: Corrigir erro de GROUP BY na função get_shopping_list_by_code

-- Recria a função para buscar lista por código compartilhado
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
