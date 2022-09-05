DROP INDEX IF EXISTS account_id_balance_height_idx;

CREATE INDEX IF NOT EXISTS account_balance_id_latest_idx ON account_balance(id, latest);
