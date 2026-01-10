-- name: CreateUser :one
INSERT INTO users (
    email, password_hash, first_name, last_name, role, status
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING id, email, first_name, last_name, role, status, created_at, updated_at;

-- name: GetUserByID :one
SELECT id, email, password_hash, first_name, last_name, phone, role, status, mfa_enabled, created_at, updated_at
FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT id, email, password_hash, first_name, last_name, phone, role, status, mfa_enabled, created_at, updated_at
FROM users
WHERE email = $1 LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET 
    first_name = COALESCE($2, first_name),
    last_name = COALESCE($3, last_name),
    phone = COALESCE($4, phone),
    updated_at = NOW()
WHERE id = $1
RETURNING id, email, first_name, last_name, phone, role, status, created_at, updated_at;

-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash = $2, updated_at = NOW()
WHERE id = $1;

-- name: UpdateUserStatus :exec
UPDATE users
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- name: ListUsers :many
SELECT id, email, first_name, last_name, phone, role, status, created_at, updated_at
FROM users
WHERE ($1::text IS NULL OR role = $1)
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
