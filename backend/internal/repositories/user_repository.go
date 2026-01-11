package repositories

import (
	"database/sql"
	"errors"
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
	query := `SELECT user_id, email, password_hash, first_name, last_name, phone, role, user_type, status, mfa_enabled, created_at, updated_at 
	          FROM users WHERE user_id = $1`
	row := r.db.QueryRow(query, id)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*User, error) {
	// Use LOWER() for case-insensitive comparison
	query := `SELECT user_id, email, password_hash, first_name, last_name, phone, role, user_type, status, mfa_enabled, created_at, updated_at 
	          FROM users WHERE LOWER(email) = LOWER($1)`
	row := r.db.QueryRow(query, email)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
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
// role must be one of: loan_officer, underwriter, processor, admin
func (r *UserRepository) Create(email, passwordHash, firstName, lastName, role string) (*User, error) {
	// Validate role is an employee role (not borrower)
	validRoles := map[string]bool{
		"loan_officer": true,
		"underwriter":  true,
		"processor":    true,
		"admin":        true,
	}
	if !validRoles[role] {
		return nil, errors.New("invalid role: must be loan_officer, underwriter, processor, or admin")
	}

	query := `INSERT INTO users (email, password_hash, first_name, last_name, role, user_type) 
	          VALUES ($1, $2, $3, $4, $5, 'employee') 
	          RETURNING user_id, email, password_hash, first_name, last_name, phone, role, user_type, status, mfa_enabled, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName, role)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.UserType, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
