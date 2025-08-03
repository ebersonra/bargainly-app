CREATE OR REPLACE FUNCTION log_cnpj_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cnpj IS DISTINCT FROM OLD.cnpj THEN
    INSERT INTO cnpj_change_log (market_id, old_cnpj, new_cnpj)
    VALUES (OLD.id, OLD.cnpj, NEW.cnpj);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela markets
DROP TRIGGER IF EXISTS trg_log_cnpj_change ON markets;

CREATE TRIGGER trg_log_cnpj_change
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION log_cnpj_change();
