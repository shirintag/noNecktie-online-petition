DROP TABLE IF EXISTS petitioners;

CREATE TABLE petitioners (
    id SERIAL primary key,
    first_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    signature TEXT not null,
    time  timestamp DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO petitioners (first_name, last_name, signatures) VALUES ('', '', '');
