CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE DATABASE file_manager;

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL
);

SELECT * FROM users;

INSERT INTO users(user_name, user_email, user_password) VALUES('aryaman', 'aryaman@gmail.com', 'aryaman123');


CREATE TABLE files(
    file_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_owner uuid NOT NULL,
    FOREIGN KEY (file_owner) REFERENCES users(user_id)
);