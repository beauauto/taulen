-- name: CreateProperty :one
INSERT INTO properties (
    street_address, unit_number, city, state, zip_code, county,
    number_of_units, year_built, purchase_price, estimated_value,
    legal_description, property_occupancy_type, property_acquired_date,
    original_cost, improvement_cost
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
) RETURNING property_id, street_address, city, state, zip_code, created_date;

-- name: GetPropertyByID :one
SELECT 
    property_id, street_address, unit_number, city, state, zip_code, county,
    number_of_units, year_built, purchase_price, estimated_value,
    legal_description, property_occupancy_type, property_acquired_date,
    original_cost, improvement_cost, created_date, last_updated_date
FROM properties
WHERE property_id = $1 LIMIT 1;

-- name: UpdateProperty :one
UPDATE properties
SET 
    street_address = COALESCE($2, street_address),
    unit_number = COALESCE($3, unit_number),
    city = COALESCE($4, city),
    state = COALESCE($5, state),
    zip_code = COALESCE($6, zip_code),
    county = COALESCE($7, county),
    number_of_units = COALESCE($8, number_of_units),
    year_built = COALESCE($9, year_built),
    purchase_price = COALESCE($10, purchase_price),
    estimated_value = COALESCE($11, estimated_value),
    legal_description = COALESCE($12, legal_description),
    property_occupancy_type = COALESCE($13, property_occupancy_type),
    property_acquired_date = COALESCE($14, property_acquired_date),
    original_cost = COALESCE($15, original_cost),
    improvement_cost = COALESCE($16, improvement_cost),
    last_updated_date = CURRENT_TIMESTAMP
WHERE property_id = $1
RETURNING property_id, street_address, city, state, zip_code, created_date, last_updated_date;
