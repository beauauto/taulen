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
// userID is the employee (User) managing this application
// borrowerID can be NULL initially, set later when primary borrower is created
// Note: This still uses loan_applications table - will need migration to deal/loan schema
func (r *URLAApplicationRepository) CreateApplication(userID string, borrowerID *int64, loanType, loanPurpose string, loanAmount float64) (int64, error) {
	query := `INSERT INTO loan_applications (
		user_id, applicant_id, application_date, loan_type, loan_purpose, loan_amount_requested, application_status
	) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'draft') RETURNING loan_application_id`
	
	var id int64
	err := r.db.QueryRow(query, userID, borrowerID, loanType, loanPurpose, loanAmount).Scan(&id)
	return id, err
}

// GetApplicationByID retrieves an application by ID
func (r *URLAApplicationRepository) GetApplicationByID(id int64) (*sql.Row, error) {
	query := `SELECT loan_application_id, applicant_id, user_id, application_date, loan_type, loan_purpose, 
		property_type, property_usage, loan_amount_requested, down_payment_amount, 
		term_years, interest_rate, amortization_type, application_status, 
		created_date, last_updated_date
		FROM loan_applications WHERE loan_application_id = $1`
	
	row := r.db.QueryRow(query, id)
	return row, nil
}

// UpdateApplicationStatus updates application status
func (r *URLAApplicationRepository) UpdateApplicationStatus(id int64, status string) error {
	query := `UPDATE loan_applications SET application_status = $1, last_updated_date = CURRENT_TIMESTAMP 
		WHERE loan_application_id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}

// GetApplicationsByUserID retrieves all applications managed by an employee
func (r *URLAApplicationRepository) GetApplicationsByUserID(userID string) (*sql.Rows, error) {
	query := `SELECT loan_application_id, applicant_id, user_id, application_date, loan_type, loan_purpose, 
		loan_amount_requested, application_status, created_date, last_updated_date
		FROM loan_applications 
		WHERE user_id = $1
		ORDER BY created_date DESC`
	return r.db.Query(query, userID)
}

// GetApplicationsByBorrowerID retrieves all applications for a borrower
// Note: This still uses loan_applications/applicants tables - will need migration to deal/borrower schema
func (r *URLAApplicationRepository) GetApplicationsByBorrowerID(borrowerID int64) (*sql.Rows, error) {
	// For now, using the old schema. Will need to update to use deal/borrower
	query := `SELECT DISTINCT la.loan_application_id, la.applicant_id, la.user_id, la.application_date, 
		la.loan_type, la.loan_purpose, la.loan_amount_requested, la.application_status, 
		la.created_date, la.last_updated_date
		FROM loan_applications la
		INNER JOIN applicants a ON a.loan_application_id = la.loan_application_id
		WHERE a.applicant_id = $1
		ORDER BY la.created_date DESC`
	return r.db.Query(query, borrowerID)
}
