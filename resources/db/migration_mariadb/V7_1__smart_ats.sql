CREATE TABLE IF NOT EXISTS at_map (db_id bigint(20) NOT NULL AUTO_INCREMENT,
    at_id bigint(20) NOT NULL, key1 bigint(20) NOT NULL, key2 bigint(20), value bigint(20),
    height INT NOT NULL, latest BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`db_id`));

