ALTER TABLE at ADD ap_code_hash_id BIGINT;

CREATE INDEX at_ap_code_hash_id_index ON at (ap_code_hash_id);