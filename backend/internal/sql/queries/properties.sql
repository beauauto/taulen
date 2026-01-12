-- name: CreateOwnedProperty :one
INSERT INTO owned_property (
    borrower_id, property_usage_type, property_status, address_line_text, city_name,
    state_code, postal_code, estimated_market_value, unpaid_balance, monthly_payment,
    gross_monthly_rental_income, net_monthly_rental_income
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING id, borrower_id, property_usage_type, property_status, address_line_text, city_name;

-- name: GetOwnedPropertyByID :one
SELECT 
    id, borrower_id, property_usage_type, property_status, address_line_text, city_name,
    state_code, postal_code, estimated_market_value, unpaid_balance, monthly_payment,
    gross_monthly_rental_income, net_monthly_rental_income
FROM owned_property
WHERE id = $1 LIMIT 1;

-- name: GetOwnedPropertiesByBorrowerID :many
SELECT 
    id, borrower_id, property_usage_type, property_status, address_line_text, city_name,
    state_code, postal_code, estimated_market_value, unpaid_balance, monthly_payment,
    gross_monthly_rental_income, net_monthly_rental_income
FROM owned_property
WHERE borrower_id = $1
ORDER BY property_usage_type;

-- name: UpdateOwnedProperty :one
UPDATE owned_property
SET 
    property_usage_type = COALESCE($2, property_usage_type),
    property_status = COALESCE($3, property_status),
    address_line_text = COALESCE($4, address_line_text),
    city_name = COALESCE($5, city_name),
    state_code = COALESCE($6, state_code),
    postal_code = COALESCE($7, postal_code),
    estimated_market_value = COALESCE($8, estimated_market_value),
    unpaid_balance = COALESCE($9, unpaid_balance),
    monthly_payment = COALESCE($10, monthly_payment),
    gross_monthly_rental_income = COALESCE($11, gross_monthly_rental_income),
    net_monthly_rental_income = COALESCE($12, net_monthly_rental_income)
WHERE id = $1
RETURNING id, borrower_id, property_usage_type, property_status, address_line_text, city_name;

-- name: DeleteOwnedProperty :exec
DELETE FROM owned_property
WHERE id = $1;

-- name: CreateSubjectProperty :one
INSERT INTO subject_property (
    deal_id, address_line_text, city_name, state_code, postal_code, unit_number,
    property_usage_type, estimated_value, projected_monthly_rental_income
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING id, deal_id, address_line_text, city_name, state_code;

-- name: GetSubjectPropertyByDealID :one
SELECT 
    id, deal_id, address_line_text, city_name, state_code, postal_code, unit_number,
    property_usage_type, estimated_value, projected_monthly_rental_income
FROM subject_property
WHERE deal_id = $1 LIMIT 1;

-- name: UpdateSubjectProperty :one
UPDATE subject_property
SET 
    address_line_text = COALESCE($2, address_line_text),
    city_name = COALESCE($3, city_name),
    state_code = COALESCE($4, state_code),
    postal_code = COALESCE($5, postal_code),
    unit_number = COALESCE($6, unit_number),
    property_usage_type = COALESCE($7, property_usage_type),
    estimated_value = COALESCE($8, estimated_value),
    projected_monthly_rental_income = COALESCE($9, projected_monthly_rental_income)
WHERE id = $1
RETURNING id, deal_id, address_line_text, city_name, state_code;
