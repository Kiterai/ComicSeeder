-- Add migration script here
ALTER TABLE users
    ADD password_reset_token VARCHAR(255) UNIQUE;
