package repositories

import (
	"database/sql"
	"taulen/backend/internal/database"
)

// User represents a user in the database (employees only)
type User struct {
	ID                          string
	Email                       string
	PasswordHash                string
	EmailVerified               sql.NullBool
	EmailVerificationToken      sql.NullString
	EmailVerificationExpiresAt  sql.NullTime
	PasswordResetToken          sql.NullString
	PasswordResetExpiresAt      sql.NullTime
	LastPasswordChangeAt        sql.NullTime
	MFAEnabled                  bool
	MFASecret                   sql.NullString
	MFABackupCodes              sql.NullString
	MFASetupAt                  sql.NullTime
	MFAVerifiedAt               sql.NullTime
	LastLoginAt                 sql.NullTime
	FailedLoginAttempts         sql.NullInt64
	AccountLockedUntil          sql.NullTime
	FirstName                   sql.NullString
	LastName                    sql.NullString
	Phone                       sql.NullString
	Role                        string
	UserType                    string // Always 'employee' for user table
	Status                      string
	CreatedAt                   sql.NullTime
	UpdatedAt                   sql.NullTime
}

// UserRepository handles user data access
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository() *UserRepository {
	return &UserRepository{
		db: database.DB,
	}
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id string) (*User, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, last_name, phone, user_role, user_type, status, created_at, updated_at 
	          FROM "user" WHERE id = $1`
	row := r.db.QueryRow(query, id)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.EmailVerified, &user.EmailVerificationToken, &user.EmailVerificationExpiresAt,
		&user.PasswordResetToken, &user.PasswordResetExpiresAt, &user.LastPasswordChangeAt,
		&user.MFAEnabled, &user.MFASecret, &user.MFABackupCodes, &user.MFASetupAt,
		&user.MFAVerifiedAt, &user.LastLoginAt, &user.FailedLoginAttempts, &user.AccountLockedUntil,
		&user.FirstName, &user.LastName, &user.Phone, &user.Role, &user.UserType, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*User, error) {
	// Use LOWER() for case-insensitive comparison
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, last_name, phone, user_role, user_type, status, created_at, updated_at 
	          FROM "user" WHERE LOWER(email_address) = LOWER($1)`
	row := r.db.QueryRow(query, email)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.EmailVerified, &user.EmailVerificationToken, &user.EmailVerificationExpiresAt,
		&user.PasswordResetToken, &user.PasswordResetExpiresAt, &user.LastPasswordChangeAt,
		&user.MFAEnabled, &user.MFASecret, &user.MFABackupCodes, &user.MFASetupAt,
		&user.MFAVerifiedAt, &user.LastLoginAt, &user.FailedLoginAttempts, &user.AccountLockedUntil,
		&user.FirstName, &user.LastName, &user.Phone, &user.Role, &user.UserType, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return user, nil
}

// Create creates a new user (employee only)
// role must be one of: LoanOfficer, Underwriter, Processor, Admin
func (r *UserRepository) Create(email, passwordHash, firstName, lastName, role string) (*User, error) {
	// Validate role is an employee role (not borrower)
	// Map common role names to schema format
	roleMap := map[string]string{
		"loan_officer": "LoanOfficer",
		"underwriter":  "Underwriter",
		"processor":     "Processor",
		"admin":         "Admin",
	}
	mappedRole, ok := roleMap[role]
	if !ok {
		// If already in correct format, use as-is
		mappedRole = role
	}

	query := `INSERT INTO "user" (email_address, password_hash, first_name, last_name, user_role, user_type) 
	          VALUES ($1, $2, $3, $4, $5, 'employee') 
	          RETURNING id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, last_name, phone, user_role, user_type, status, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName, mappedRole)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.EmailVerified, &user.EmailVerificationToken, &user.EmailVerificationExpiresAt,
		&user.PasswordResetToken, &user.PasswordResetExpiresAt, &user.LastPasswordChangeAt,
		&user.MFAEnabled, &user.MFASecret, &user.MFABackupCodes, &user.MFASetupAt,
		&user.MFAVerifiedAt, &user.LastLoginAt, &user.FailedLoginAttempts, &user.AccountLockedUntil,
		&user.FirstName, &user.LastName, &user.Phone, &user.Role, &user.UserType, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
