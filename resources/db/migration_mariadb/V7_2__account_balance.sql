CREATE TABLE IF NOT EXISTS account_balance (db_id bigint(20) NOT NULL AUTO_INCREMENT,
    id bigint(20) NOT NULL,
    balance bigint(20) NOT NULL,
    unconfirmed_balance bigint(20) NOT NULL,
    forged_balance bigint(20) NOT NULL,
    height INT NOT NULL, latest BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`db_id`));

CREATE INDEX IF NOT EXISTS account_balance_id_balance_height_idx ON account_balance (id, balance, height DESC);
