package repositories

import (
	"database/sql"
	"taulen/backend/internal/database"
)

// DealRepository handles deal (mortgage application) data access
// A deal represents a mortgage application in the new schema
type DealRepository struct {
	db *sql.DB
}

// NewDealRepository creates a new deal repository
func NewDealRepository() *DealRepository {
	return &DealRepository{
		db: database.DB,
	}
}

// CreateDeal creates a new deal (mortgage application) with an associated loan
// userID is the employee (User) managing this deal (can be NULL)
// borrowerID can be NULL initially, set later when primary borrower is created
// status defaults to 'Draft' if empty
// Returns the deal ID (which is the primary identifier for an application)
func (r *DealRepository) CreateDeal(userID string, borrowerID *string, loanPurpose string, loanAmount float64, status string) (string, error) {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	// Create deal first
	var dealID string
	applicationType := "IndividualCredit" // Default, can be updated later for joint applications
	totalBorrowers := 1
	if borrowerID != nil {
		// If borrower exists, this might be a joint application - will need to check
		applicationType = "IndividualCredit"
		totalBorrowers = 1 // Will be updated when co-borrowers are added
	}

	// Default status to 'Draft' if not provided
	if status == "" {
		status = "Draft"
	}

	// Build query with optional primary_borrower_id
	if borrowerID != nil {
		dealQuery := `INSERT INTO deal (application_type, total_borrowers, application_date, primary_borrower_id) 
		              VALUES ($1, $2, CURRENT_DATE, $3) RETURNING id`
		err = tx.QueryRow(dealQuery, applicationType, totalBorrowers, *borrowerID).Scan(&dealID)
	} else {
		dealQuery := `INSERT INTO deal (application_type, total_borrowers, application_date) 
		              VALUES ($1, $2, CURRENT_DATE) RETURNING id`
		err = tx.QueryRow(dealQuery, applicationType, totalBorrowers).Scan(&dealID)
	}
	if err != nil {
		return "", err
	}

	// Create loan record linked to deal
	loanQuery := `INSERT INTO loan (deal_id, loan_purpose_type, loan_amount_requested) 
	              VALUES ($1, $2, $3) RETURNING id`
	var loanID string
	err = tx.QueryRow(loanQuery, dealID, loanPurpose, loanAmount).Scan(&loanID)
	if err != nil {
		return "", err
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return "", err
	}

	// Return deal ID as the application identifier
	return dealID, nil
}

// GetDealByID retrieves a deal by ID with associated loan information
// Returns a row with deal and loan information
func (r *DealRepository) GetDealByID(dealID string) (*sql.Row, error) {
	query := `SELECT d.id, d.loan_number, d.universal_loan_identifier, d.agency_case_identifier,
		d.application_type, d.total_borrowers, d.application_date, d.created_at, d.primary_borrower_id,
		d.current_form_step,
		l.id as loan_id, l.loan_purpose_type, l.loan_amount_requested, l.loan_term_months,
		l.interest_rate_percentage, l.property_type, l.manufactured_home_width_type, l.title_manner_type
		FROM deal d
		LEFT JOIN loan l ON l.deal_id = d.id
		WHERE d.id = $1`
	
	row := r.db.QueryRow(query, dealID)
	return row, nil
}

// GetDealByLoanNumber retrieves a deal by loan number
func (r *DealRepository) GetDealByLoanNumber(loanNumber string) (*sql.Row, error) {
	query := `SELECT d.id, d.loan_number, d.universal_loan_identifier, d.agency_case_identifier,
		d.application_type, d.total_borrowers, d.application_date, d.created_at,
		l.id as loan_id, l.loan_purpose_type, l.loan_amount_requested, l.loan_term_months,
		l.interest_rate_percentage, l.property_type, l.manufactured_home_width_type, l.title_manner_type
		FROM deal d
		LEFT JOIN loan l ON l.deal_id = d.id
		WHERE d.loan_number = $1`
	
	row := r.db.QueryRow(query, loanNumber)
	return row, nil
}

// UpdateDeal updates deal information
func (r *DealRepository) UpdateDeal(dealID string, loanNumber, universalLoanIdentifier, agencyCaseIdentifier *string, applicationType *string, totalBorrowers *int) error {
	query := `UPDATE deal SET 
		loan_number = COALESCE($2, loan_number),
		universal_loan_identifier = COALESCE($3, universal_loan_identifier),
		agency_case_identifier = COALESCE($4, agency_case_identifier),
		application_type = COALESCE($5, application_type),
		total_borrowers = COALESCE($6, total_borrowers)
		WHERE id = $1`
	
	_, err := r.db.Exec(query, dealID, loanNumber, universalLoanIdentifier, agencyCaseIdentifier, applicationType, totalBorrowers)
	return err
}

// UpdateCurrentFormStep updates the current form step for a deal
func (r *DealRepository) UpdateCurrentFormStep(dealID string, formStep string) error {
	query := `UPDATE deal SET current_form_step = $2 WHERE id = $1`
	_, err := r.db.Exec(query, dealID, formStep)
	return err
}

// UpdateToJointApplication updates a deal to joint application type
func (r *DealRepository) UpdateToJointApplication(dealID string) error {
	applicationType := "JointCredit"
	totalBorrowers := 2
	return r.UpdateDeal(dealID, nil, nil, nil, &applicationType, &totalBorrowers)
}

// UpdateLoan updates loan information for a deal
func (r *DealRepository) UpdateLoan(dealID string, loanPurpose, propertyType, manufacturedHomeWidthType, titleMannerType *string, loanAmount *float64, loanTermMonths *int, interestRate *float64) error {
	query := `UPDATE loan SET 
		loan_purpose_type = COALESCE($2, loan_purpose_type),
		loan_amount_requested = COALESCE($3, loan_amount_requested),
		loan_term_months = COALESCE($4, loan_term_months),
		interest_rate_percentage = COALESCE($5, interest_rate_percentage),
		property_type = COALESCE($6, property_type),
		manufactured_home_width_type = COALESCE($7, manufactured_home_width_type),
		title_manner_type = COALESCE($8, title_manner_type)
		WHERE deal_id = $1`
	
	_, err := r.db.Exec(query, dealID, loanPurpose, loanAmount, loanTermMonths, interestRate, propertyType, manufacturedHomeWidthType, titleMannerType)
	return err
}

// CreateSubjectProperty creates a subject property record for a deal
func (r *DealRepository) CreateSubjectProperty(dealID string, address, city, state, zipCode string, estimatedValue float64) (string, error) {
	query := `INSERT INTO subject_property (deal_id, address_line_text, city_name, state_code, postal_code, estimated_value, property_usage_type) 
	          VALUES ($1, $2, $3, $4, $5, $6, 'PrimaryResidence') RETURNING id`
	var propertyID string
	err := r.db.QueryRow(query, dealID, address, city, state, zipCode, estimatedValue).Scan(&propertyID)
	return propertyID, err
}

// GetDealsByUserID retrieves all deals managed by an employee
// Note: The new schema doesn't have user_id in deal table
// This relationship might need to be tracked in a separate table (deal_user_assignment) or added to deal
// For now, returning all deals - this needs to be updated when user assignment is implemented
func (r *DealRepository) GetDealsByUserID(userID string) (*sql.Rows, error) {
	// TODO: Add user_id to deal table or create deal_user_assignment junction table
	// For now, return all deals - this is a placeholder
	query := `SELECT d.id, d.loan_number, d.application_type, d.application_date, d.created_at,
		l.loan_purpose_type, l.loan_amount_requested
		FROM deal d
		LEFT JOIN loan l ON l.deal_id = d.id
		ORDER BY d.created_at DESC`
	return r.db.Query(query)
}

// GetDealsByBorrowerID retrieves all deals for a borrower, ordered by latest modification
func (r *DealRepository) GetDealsByBorrowerID(borrowerID string) (*sql.Rows, error) {
	query := `SELECT d.id, d.loan_number, d.application_type, d.application_date, d.created_at, d.status,
		l.loan_purpose_type, l.loan_amount_requested,
		COALESCE(dp.updated_at, d.created_at) as last_updated_at,
		dp.progress_percentage, dp.last_updated_section
		FROM deal d
		LEFT JOIN loan l ON l.deal_id = d.id
		LEFT JOIN deal_progress dp ON dp.deal_id = d.id
		WHERE d.primary_borrower_id = $1
		ORDER BY COALESCE(dp.updated_at, d.created_at) DESC, d.created_at DESC`
	return r.db.Query(query, borrowerID)
}

// ListDeals retrieves all deals with pagination
func (r *DealRepository) ListDeals(limit, offset int) (*sql.Rows, error) {
	query := `SELECT d.id, d.loan_number, d.universal_loan_identifier, d.application_type, 
		d.total_borrowers, d.application_date, d.created_at,
		l.loan_purpose_type, l.loan_amount_requested
		FROM deal d
		LEFT JOIN loan l ON l.deal_id = d.id
		ORDER BY d.created_at DESC
		LIMIT $1 OFFSET $2`
	return r.db.Query(query, limit, offset)
}
