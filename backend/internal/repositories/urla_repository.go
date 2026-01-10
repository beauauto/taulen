package repositories

import (
	"database/sql"
	"taulen/backend/internal/database"
)

// URLAApplicationRepository handles URLA application data access
type URLAApplicationRepository struct {
	db *sql.DB
}

// NewURLAApplicationRepository creates a new URLA repository
func NewURLAApplicationRepository() *URLAApplicationRepository {
	return &URLAApplicationRepository{
		db: database.DB,
	}
}

// Note: These methods will use direct SQL queries until sqlc is set up
// Once sqlc is configured, these should use the generated code

// CreateApplication creates a new loan application
func (r *URLAApplicationRepository) CreateApplication(loanType, loanPurpose string, loanAmount float64) (int64, error) {
	query := `INSERT INTO loanapplications (
		application_date, loan_type, loan_purpose, loan_amount_requested, application_status
	) VALUES (CURRENT_DATE, $1, $2, $3, 'draft') RETURNING loan_application_id`
	
	var id int64
	err := r.db.QueryRow(query, loanType, loanPurpose, loanAmount).Scan(&id)
	return id, err
}

// GetApplicationByID retrieves an application by ID
func (r *URLAApplicationRepository) GetApplicationByID(id int64) (*sql.Row, error) {
	query := `SELECT loan_application_id, application_date, loan_type, loan_purpose, 
		property_type, property_usage, loan_amount_requested, down_payment_amount, 
		term_years, interest_rate, amortization_type, application_status, 
		created_date, last_updated_date
		FROM loanapplications WHERE loan_application_id = $1`
	
	row := r.db.QueryRow(query, id)
	return row, nil
}

// UpdateApplicationStatus updates application status
func (r *URLAApplicationRepository) UpdateApplicationStatus(id int64, status string) error {
	query := `UPDATE loanapplications SET application_status = $1, last_updated_date = CURRENT_TIMESTAMP 
		WHERE loan_application_id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}
