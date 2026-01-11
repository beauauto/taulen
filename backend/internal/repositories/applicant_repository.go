package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"taulen/backend/internal/database"
)

// Applicant represents an applicant in the database
type Applicant struct {
	ApplicantID       int64
	LoanApplicationID sql.NullInt64
	UserID            sql.NullString
	Email             sql.NullString
	PasswordHash      sql.NullString
	FirstName         string
	LastName          string
	IsPrimaryApplicant bool
	CreatedAt         sql.NullTime
	UpdatedAt         sql.NullTime
}

// ApplicantRepository handles applicant data access
type ApplicantRepository struct {
	db *sql.DB
}

// NewApplicantRepository creates a new applicant repository
func NewApplicantRepository() *ApplicantRepository {
	return &ApplicantRepository{
		db: database.DB,
	}
}

// GetByEmail retrieves an applicant by email (for authentication)
func (r *ApplicantRepository) GetByEmail(email string) (*Applicant, error) {
	// Use LOWER() for case-insensitive comparison and handle NULL emails
	query := `SELECT applicant_id, loan_application_id, user_id, email, password_hash, 
	          first_name, last_name, is_primary_applicant, created_date, last_updated_date
	          FROM applicants WHERE LOWER(email) = LOWER($1) AND email IS NOT NULL`
	row := r.db.QueryRow(query, email)

	applicant := &Applicant{}
	err := row.Scan(
		&applicant.ApplicantID, &applicant.LoanApplicationID, &applicant.UserID,
		&applicant.Email, &applicant.PasswordHash, &applicant.FirstName, &applicant.LastName,
		&applicant.IsPrimaryApplicant, &applicant.CreatedAt, &applicant.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return applicant, nil
}

// GetByID retrieves an applicant by ID
func (r *ApplicantRepository) GetByID(id int64) (*Applicant, error) {
	query := `SELECT applicant_id, loan_application_id, user_id, email, password_hash, 
	          first_name, last_name, is_primary_applicant, created_date, last_updated_date
	          FROM applicants WHERE applicant_id = $1`
	row := r.db.QueryRow(query, id)

	applicant := &Applicant{}
	err := row.Scan(
		&applicant.ApplicantID, &applicant.LoanApplicationID, &applicant.UserID,
		&applicant.Email, &applicant.PasswordHash, &applicant.FirstName, &applicant.LastName,
		&applicant.IsPrimaryApplicant, &applicant.CreatedAt, &applicant.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return applicant, nil
}

// Create creates a new applicant in the applicants table (during signup)
// This is the only way applicants are created - employees are created in users table by admins
// loan_application_id and user_id can be NULL initially
func (r *ApplicantRepository) Create(email, passwordHash, firstName, lastName string) (*Applicant, error) {
	query := `INSERT INTO applicants (email, password_hash, first_name, last_name, is_primary_applicant) 
	          VALUES ($1, $2, $3, $4, TRUE) 
	          RETURNING applicant_id, loan_application_id, user_id, email, password_hash, 
	          first_name, last_name, is_primary_applicant, created_date, last_updated_date`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName)

	applicant := &Applicant{}
	err := row.Scan(
		&applicant.ApplicantID, &applicant.LoanApplicationID, &applicant.UserID,
		&applicant.Email, &applicant.PasswordHash, &applicant.FirstName, &applicant.LastName,
		&applicant.IsPrimaryApplicant, &applicant.CreatedAt, &applicant.UpdatedAt,
	)
	if err != nil {
		// Check for unique constraint violation (pgx error format)
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") || strings.Contains(strings.ToLower(errStr), "email") {
				return nil, errors.New("applicant with this email already exists")
			}
		}
		return nil, err
	}
	return applicant, nil
}

// GetApplicationsByApplicantID retrieves all applications for an applicant
// (as primary or co-applicant)
func (r *ApplicantRepository) GetApplicationsByApplicantID(applicantID int64) ([]int64, error) {
	query := `SELECT DISTINCT loan_application_id FROM applicants 
	          WHERE applicant_id = $1 AND loan_application_id IS NOT NULL`
	rows, err := r.db.Query(query, applicantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var applicationIDs []int64
	for rows.Next() {
		var appID int64
		if err := rows.Scan(&appID); err != nil {
			return nil, err
		}
		applicationIDs = append(applicationIDs, appID)
	}
	return applicationIDs, rows.Err()
}
