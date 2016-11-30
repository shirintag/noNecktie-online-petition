DROP TABLE IF EXISTS petitioners;

CREATE TABLE petitioners (
    id SERIAL primary key,
    firs_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    signatures TEXT not null,
    time  timestamp DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO petitioners (firs_name, last_name, signatures) VALUES ('', '', '');
