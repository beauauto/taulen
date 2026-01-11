package services

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
	"taulen/backend/internal/utils"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo      *repositories.UserRepository
	applicantRepo *repositories.ApplicantRepository
	jwtManager    *utils.JWTManager
}

// NewAuthService creates a new auth service
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:      repositories.NewUserRepository(),
		applicantRepo: repositories.NewApplicantRepository(),
		jwtManager:    utils.NewJWTManager(&cfg.JWT),
	}
}

// RegisterRequest represents a registration request (applicants only)
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest represents a refresh token request
type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	User         UserResponse `json:"user"`
}

// UserResponse represents user information in response
type UserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role,omitempty"`      // Only for employees
	UserType  string `json:"userType"`            // 'employee' or 'applicant'
}

// Register registers a new applicant (signup is only for applicants)
// IMPORTANT: This creates entries in the "Applicants" table, NOT the "Users" table.
// The "Users" table is reserved for employees created by system admins via CreateEmployee.
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Check if applicant already exists
	existingApplicant, err := s.applicantRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		// Unexpected database error - log it for debugging
		return nil, fmt.Errorf("failed to check if applicant exists: %w", err)
	}
	if existingApplicant != nil {
		return nil, errors.New("applicant with this email already exists")
	}

	// Check if employee with this email exists
	existingUser, err := s.userRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		// Unexpected database error - log it for debugging
		return nil, fmt.Errorf("failed to check if user exists: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("this email is already registered as an employee account")
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Create applicant in "Applicants" table (NOT "Users" table)
	// Employees are created separately by admins via CreateEmployee method
	applicant, err := s.applicantRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName)
	if err != nil {
		// Check if it's a unique constraint error that we already handle
		if strings.Contains(err.Error(), "applicant with this email already exists") {
			return nil, err
		}
		// Return the actual error for debugging
		return nil, fmt.Errorf("failed to create applicant: %w", err)
	}

	// Generate tokens - use ApplicantID as string for ID
	applicantIDStr := utils.Int64ToString(applicant.ApplicantID)
	email := ""
	if applicant.Email.Valid {
		email = applicant.Email.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        applicantIDStr,
			Email:     email,
			FirstName: applicant.FirstName,
			LastName:  applicant.LastName,
			UserType:  "applicant",
		},
	}, nil
}

// Login authenticates a user (employee or applicant)
// First checks Users table, then Applicants table
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	// Try employee login first
	user, err := s.userRepo.GetByEmail(req.Email)
	if err == nil {
		// Found in Users table - employee login
		if user.Status != "active" {
			return nil, errors.New("account is not active")
		}

		if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
			return nil, errors.New("invalid email or password")
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email)
		if err != nil {
			return nil, errors.New("failed to generate access token")
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email)
		if err != nil {
			return nil, errors.New("failed to generate refresh token")
		}

		firstName := ""
		if user.FirstName.Valid {
			firstName = user.FirstName.String
		}
		lastName := ""
		if user.LastName.Valid {
			lastName = user.LastName.String
		}

		return &AuthResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			User: UserResponse{
				ID:        user.ID,
				Email:     user.Email,
				FirstName: firstName,
				LastName:  lastName,
				Role:      user.Role,
				UserType:  "employee",
			},
		}, nil
	}

	// If error is not "not found", it's a database error
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("failed to check user account")
	}

	// Try applicant login
	applicant, err := s.applicantRepo.GetByEmail(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid email or password")
		}
		return nil, errors.New("failed to check applicant account")
	}

	// Verify password
	if !applicant.PasswordHash.Valid {
		return nil, errors.New("invalid email or password")
	}

	if !utils.CheckPasswordHash(req.Password, applicant.PasswordHash.String) {
		return nil, errors.New("invalid email or password")
	}

	// Generate tokens
	applicantIDStr := utils.Int64ToString(applicant.ApplicantID)
	email := ""
	if applicant.Email.Valid {
		email = applicant.Email.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        applicantIDStr,
			Email:     email,
			FirstName: applicant.FirstName,
			LastName:  applicant.LastName,
			UserType:  "applicant",
		},
	}, nil
}

// RefreshToken refreshes an access token using a refresh token
// Handles both employee and applicant tokens
func (s *AuthService) RefreshToken(req RefreshRequest) (*AuthResponse, error) {
	// Validate refresh token
	claims, err := s.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	// Try employee first
	user, err := s.userRepo.GetByID(claims.UserID)
	if err == nil {
		// Found employee - generate new tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email)
		if err != nil {
			return nil, errors.New("failed to generate access token")
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email)
		if err != nil {
			return nil, errors.New("failed to generate refresh token")
		}

		firstName := ""
		if user.FirstName.Valid {
			firstName = user.FirstName.String
		}
		lastName := ""
		if user.LastName.Valid {
			lastName = user.LastName.String
		}

		return &AuthResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			User: UserResponse{
				ID:        user.ID,
				Email:     user.Email,
				FirstName: firstName,
				LastName:  lastName,
				Role:      user.Role,
				UserType:  "employee",
			},
		}, nil
	}

	// Try applicant
	applicantID, err := utils.StringToInt64(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid token")
	}

	applicant, err := s.applicantRepo.GetByID(applicantID)
	if err != nil {
		return nil, errors.New("applicant not found")
	}

	// Generate new tokens
	applicantIDStr := utils.Int64ToString(applicant.ApplicantID)
	email := ""
	if applicant.Email.Valid {
		email = applicant.Email.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(applicantIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        applicantIDStr,
			Email:     email,
			FirstName: applicant.FirstName,
			LastName:  applicant.LastName,
			UserType:  "applicant",
		},
	}, nil
}

// CreateEmployeeRequest represents a request to create an employee account (admin only)
type CreateEmployeeRequest struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      string
}

// CreateEmployee creates a new employee account (admin only)
func (s *AuthService) CreateEmployee(req CreateEmployeeRequest) (*UserResponse, error) {
	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("employee with this email already exists")
	}

	// Check if applicant with this email exists
	existingApplicant, _ := s.applicantRepo.GetByEmail(req.Email)
	if existingApplicant != nil {
		return nil, errors.New("email already registered as applicant")
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Create employee
	user, err := s.userRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName, req.Role)
	if err != nil {
		return nil, err
	}

	firstName := ""
	if user.FirstName.Valid {
		firstName = user.FirstName.String
	}
	lastName := ""
	if user.LastName.Valid {
		lastName = user.LastName.String
	}

	return &UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: firstName,
		LastName:  lastName,
		Role:      user.Role,
		UserType:  "employee",
	}, nil
}

// GetJWTManager returns the JWT manager (for middleware)
func (s *AuthService) GetJWTManager() *utils.JWTManager {
	return s.jwtManager
}
