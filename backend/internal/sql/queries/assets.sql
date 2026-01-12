-- name: CreateAsset :one
INSERT INTO asset (
    borrower_id, asset_type, financial_institution_name, account_number, cash_or_market_value
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING id, borrower_id, asset_type, financial_institution_name, account_number, cash_or_market_value;

-- name: GetAssetsByBorrowerID :many
SELECT 
    id, borrower_id, asset_type, financial_institution_name, account_number, cash_or_market_value
FROM asset
WHERE borrower_id = $1
ORDER BY asset_type;

-- name: UpdateAsset :one
UPDATE asset
SET 
    asset_type = COALESCE($2, asset_type),
    financial_institution_name = COALESCE($3, financial_institution_name),
    account_number = COALESCE($4, account_number),
    cash_or_market_value = COALESCE($5, cash_or_market_value)
WHERE id = $1
RETURNING id, borrower_id, asset_type, financial_institution_name, account_number, cash_or_market_value;

-- name: DeleteAsset :exec
DELETE FROM asset
WHERE id = $1;
