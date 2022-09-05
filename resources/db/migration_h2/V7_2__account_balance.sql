CREATE TABLE IF NOT EXISTS account_balance (db_id IDENTITY,
    id BIGINT NOT NULL,
    balance BIGINT NOT NULL,
    unconfirmed_balance BIGINT NOT NULL,
    forged_balance BIGINT NOT NULL,
    height INT NOT NULL, latest BOOLEAN NOT NULL DEFAULT TRUE);

CREATE INDEX IF NOT EXISTS account_balance_id_balance_height_idx ON account_balance (id, balance, height DESC);
