package repositories

import (
	"database/sql"
	"taulen/backend/internal/database"
)

// User represents a user in the database
type User struct {
	ID           string
	Email        string
	PasswordHash string
	FirstName    sql.NullString
	LastName     sql.NullString
	Phone        sql.NullString
	Role         string
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
	query := `SELECT id, email, password_hash, first_name, last_name, phone, role, status, mfa_enabled, created_at, updated_at 
	          FROM users WHERE id = $1`
	row := r.db.QueryRow(query, id)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*User, error) {
	query := `SELECT id, email, password_hash, first_name, last_name, phone, role, status, mfa_enabled, created_at, updated_at 
	          FROM users WHERE email = $1`
	row := r.db.QueryRow(query, email)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Create creates a new user
func (r *UserRepository) Create(email, passwordHash, firstName, lastName, role string) (*User, error) {
	query := `INSERT INTO users (email, password_hash, first_name, last_name, role) 
	          VALUES ($1, $2, $3, $4, $5) 
	          RETURNING id, email, password_hash, first_name, last_name, phone, role, status, mfa_enabled, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName, role)

	user := &User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.Status, &user.MFAEnabled, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
