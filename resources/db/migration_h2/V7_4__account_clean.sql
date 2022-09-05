DROP INDEX IF EXISTS account_id_balance_height_idx;

ALTER TABLE account DROP COLUMN IF EXISTS balance;
ALTER TABLE account DROP COLUMN IF EXISTS unconfirmed_balance;
ALTER TABLE account DROP COLUMN IF EXISTS forged_balance;
