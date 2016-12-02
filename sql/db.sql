DROP TABLE IF EXISTS petitioners;
DROP TABLE IF EXISTS users;

CREATE TABLE petitioners (
    id SERIAL primary key,
    first_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    signature TEXT not null,
    user_id INTEGER not null,
    time  timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) not null,
    time  timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles(
    id SERIAL primary key,
    user_id INTEGER not null,
    age INTEGER,
    city VARCHAR(255),
    url TEXT
);
INSERT INTO petitioners (first_name, last_name, signature) VALUES ('disco', 'doc', 'shdwvfwtg');
INSERT INTO users (first_name, last_name, signature) VALUES ('disco', 'doc', '@gmail.com', 'password');
