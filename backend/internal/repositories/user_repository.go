package repositories

import (
	"database/sql"
	"strconv"
	"taulen/backend/internal/database"
)

// User represents a user in the database (employees only)
type User struct {
	ID           string
	Email        string
	PasswordHash string
	FirstName    sql.NullString
	LastName     sql.NullString
	Phone        sql.NullString
	Role         string
	UserType     string // Always 'employee' for Users table
	Status       string
	MFAEnabled   bool
	CreatedAt    sql.NullTime
	UpdatedAt    sql.NullTime
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
	// Convert string ID to int for the user table (id is SERIAL)
	userIDInt, err := strconv.Atoi(id)
	if err != nil {
		return nil, err
	}
	query := `SELECT id, email_address, password_hash, first_name, last_name, phone, user_role, user_type, status, mfa_enabled, created_at, updated_at 
	          FROM "user" WHERE id = $1`
	row := r.db.QueryRow(query, userIDInt)

	user := &User{}
	var userIDInt64 int
	err = row.Scan(
		&userIDInt64, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	user.ID = strconv.Itoa(userIDInt64)
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*User, error) {
	// Use LOWER() for case-insensitive comparison
	query := `SELECT id, email_address, password_hash, first_name, last_name, phone, user_role, user_type, status, mfa_enabled, created_at, updated_at 
	          FROM "user" WHERE LOWER(email_address) = LOWER($1)`
	row := r.db.QueryRow(query, email)

	user := &User{}
	var userIDInt int
	err := row.Scan(
		&userIDInt, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	user.ID = strconv.Itoa(userIDInt)
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
	          RETURNING id, email_address, password_hash, first_name, last_name, phone, user_role, user_type, status, mfa_enabled, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName, mappedRole)

	user := &User{}
	var userIDInt int
	err := row.Scan(
		&userIDInt, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	user.ID = strconv.Itoa(userIDInt)
	return user, nil
}
