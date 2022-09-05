
ALTER TABLE account DROP COLUMN IF EXISTS balance;
ALTER TABLE account DROP COLUMN IF EXISTS unconfirmed_balance;
ALTER TABLE account DROP COLUMN IF EXISTS forged_balance;
