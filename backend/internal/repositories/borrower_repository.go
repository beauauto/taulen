package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"taulen/backend/internal/database"
)

// Borrower represents a borrower in the database
type Borrower struct {
	ID                          int64
	EmailAddress                sql.NullString
	PasswordHash                sql.NullString
	EmailVerified               sql.NullBool
	EmailVerificationToken      sql.NullString
	EmailVerificationExpiresAt  sql.NullTime
	PasswordResetToken          sql.NullString
	PasswordResetExpiresAt      sql.NullTime
	LastPasswordChangeAt        sql.NullTime
	MFAEnabled                  sql.NullBool
	MFASecret                   sql.NullString
	MFABackupCodes              sql.NullString
	MFASetupAt                  sql.NullTime
	MFAVerifiedAt               sql.NullTime
	LastLoginAt                 sql.NullTime
	FailedLoginAttempts         sql.NullInt64
	AccountLockedUntil          sql.NullTime
	FirstName                   string
	MiddleName                  sql.NullString
	LastName                    string
	Suffix                      sql.NullString
	TaxpayerIDType              sql.NullString
	TaxpayerIDValue             sql.NullString
	BirthDate                   sql.NullTime
	CitizenshipType             sql.NullString
	MaritalStatus               sql.NullString
	DependentCount              sql.NullInt64
	DependentAges               sql.NullString
	HomePhone                   sql.NullString
	MobilePhone                 sql.NullString
	WorkPhone                   sql.NullString
	WorkPhoneExt                sql.NullString
	CreatedAt                   sql.NullTime
	UpdatedAt                   sql.NullTime
}

// BorrowerRepository handles borrower data access
type BorrowerRepository struct {
	db *sql.DB
}

// NewBorrowerRepository creates a new borrower repository
func NewBorrowerRepository() *BorrowerRepository {
	return &BorrowerRepository{
		db: database.DB,
	}
}

// GetByEmail retrieves a borrower by email (for authentication)
func (r *BorrowerRepository) GetByEmail(email string) (*Borrower, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at
	          FROM borrower WHERE LOWER(email_address) = LOWER($1) AND email_address IS NOT NULL`
	row := r.db.QueryRow(query, email)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return borrower, nil
}

// GetByID retrieves a borrower by ID
func (r *BorrowerRepository) GetByID(id int64) (*Borrower, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at
	          FROM borrower WHERE id = $1`
	row := r.db.QueryRow(query, id)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return borrower, nil
}

// Create creates a new borrower in the borrower table (during signup)
func (r *BorrowerRepository) Create(email, passwordHash, firstName, lastName string) (*Borrower, error) {
	query := `INSERT INTO borrower (email_address, password_hash, first_name, last_name) 
	          VALUES ($1, $2, $3, $4) 
	          RETURNING id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		// Check for unique constraint violation
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") || strings.Contains(strings.ToLower(errStr), "email") {
				return nil, errors.New("borrower with this email already exists")
			}
		}
		return nil, err
	}
	return borrower, nil
}

// Note: deal_id has been removed from borrower table
// Borrowers are linked to deals through the deal.borrower_id relationship or a junction table if needed
