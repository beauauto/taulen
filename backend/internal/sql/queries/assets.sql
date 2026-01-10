-- name: CreateAsset :one
INSERT INTO assets (
    loan_application_id, applicant_id, asset_type, description, current_value, account_last_four
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING asset_id, loan_application_id, applicant_id, asset_type, current_value, created_date;

-- name: GetAssetsByApplicationID :many
SELECT 
    asset_id, loan_application_id, applicant_id, asset_type, description,
    current_value, account_last_four, created_date, last_updated_date
FROM assets
WHERE loan_application_id = $1
ORDER BY asset_type, created_date;

-- name: UpdateAsset :one
UPDATE assets
SET 
    asset_type = COALESCE($2, asset_type),
    description = COALESCE($3, description),
    current_value = COALESCE($4, current_value),
    account_last_four = COALESCE($5, account_last_four),
    last_updated_date = CURRENT_TIMESTAMP
WHERE asset_id = $1
RETURNING asset_id, loan_application_id, applicant_id, asset_type, current_value, created_date, last_updated_date;

-- name: DeleteAsset :exec
DELETE FROM assets
WHERE asset_id = $1;
