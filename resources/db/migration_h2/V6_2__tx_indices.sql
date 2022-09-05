CREATE INDEX IF NOT EXISTS tx_sender_type ON transaction (sender_id, type);
CREATE INDEX IF NOT EXISTS indirect_incoming_id_index ON indirect_incoming (account_id);