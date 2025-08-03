-- 1. Adiciona a coluna CNPJ (alfanumérico e flexível)
ALTER TABLE markets
ADD COLUMN cnpj TEXT;

-- Comentário explicativo
COMMENT ON COLUMN markets.cnpj IS 'CNPJ do mercado. Inicialmente numérico com 14 dígitos, mas preparado para formatos alfanuméricos futuros.';

-- 2. (Opcional) Função de validação de CNPJ com base nos dígitos verificadores
CREATE OR REPLACE FUNCTION is_valid_cnpj(cnpj_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cnpj_clean TEXT;
  nums INT[];
  dv1 INT;
  dv2 INT;
  i INT;
BEGIN
  -- Remove qualquer caractere não numérico
  cnpj_clean := regexp_replace(cnpj_input, '\D', '', 'g');

  -- Verifica se tem 14 dígitos
  IF length(cnpj_clean) != 14 THEN
    RETURN FALSE;
  END IF;

  -- Converte para array de inteiros
  nums := string_to_array(cnpj_clean, NULL)::INT[];

  -- Calcula o primeiro dígito verificador
  dv1 := 0;
  FOR i IN 1..12 LOOP
    dv1 := dv1 + nums[i] * (CASE WHEN i < 5 THEN 6 - i ELSE 14 - i END);
  END LOOP;
  dv1 := 11 - (dv1 % 11);
  IF dv1 >= 10 THEN dv1 := 0; END IF;

  -- Verifica o primeiro dígito
  IF dv1 != nums[13] THEN
    RETURN FALSE;
  END IF;

  -- Calcula o segundo dígito verificador
  dv2 := 0;
  FOR i IN 1..13 LOOP
    dv2 := dv2 + nums[i] * (CASE WHEN i < 6 THEN 7 - i ELSE 15 - i END);
  END LOOP;
  dv2 := 11 - (dv2 % 11);
  IF dv2 >= 10 THEN dv2 := 0; END IF;

  -- Verifica o segundo dígito
  IF dv2 != nums[14] THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. (Opcional) Constraint para validar CNPJs inseridos
-- Comente essa linha caso queira permitir qualquer texto
ALTER TABLE markets
ADD CONSTRAINT valid_cnpj_constraint
CHECK (
  cnpj IS NULL OR is_valid_cnpj(cnpj)
);

-- 4. Atualiza a view active_markets com a nova coluna
DROP VIEW IF EXISTS active_markets;

CREATE OR REPLACE VIEW active_markets AS
SELECT
  id,
  name,
  address,
  cnpj,
  created_at,
  updated_at,
  deleted_at
FROM markets
WHERE deleted_at IS NULL;
