-- Add migration script here
CREATE TABLE works (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    owner_id INT NOT NULL REFERENCES users(id),
    comic_data BYTEA NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
