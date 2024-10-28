-- Add migration script here
ALTER TABLE users
    ALTER verification_token DROP NOT NULL;
