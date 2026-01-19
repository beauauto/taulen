package services

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
	"taulen/backend/internal/utils"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo     *repositories.UserRepository
	borrowerRepo *repositories.BorrowerRepository
	jwtManager   *utils.JWTManager
	cfg          *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:     repositories.NewUserRepository(),
		borrowerRepo: repositories.NewBorrowerRepository(),
		jwtManager:   utils.NewJWTManager(&cfg.JWT),
		cfg:          cfg,
	}
}

// GetConfig returns the config (for use in handlers)
func (s *AuthService) GetConfig() *config.Config {
	return s.cfg
}

// RegisterRequest represents a registration request (borrowers only)
// DEPRECATED: Use VerifyAndRegisterRequest instead for 2FA
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Phone     string `json:"phone" binding:"required"` // Phone is required for 2FA
}

// VerifyAndRegisterRequest represents a registration request with verification code
// NOTE: VerificationCode is optional when 2FA is disabled
type VerifyAndRegisterRequest struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=8"`
	FirstName       string `json:"firstName" binding:"required"`
	LastName        string `json:"lastName" binding:"required"`
	Phone           string `json:"phone"` // Optional when 2FA is disabled
	VerificationCode string `json:"verificationCode"` // Optional when 2FA is disabled
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required"`
	VerificationCode string `json:"verificationCode,omitempty"` // Optional: required for 2FA login
}

// SendLoginVerificationCodeRequest represents a request to send verification code for login
type SendLoginVerificationCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
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

// Register registers a new borrower (signup is only for borrowers)
// IMPORTANT: This creates entries in the "borrower" table, NOT the "user" table.
// The "user" table is reserved for employees created by system admins via CreateEmployee.
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Check if borrower already exists
	existingBorrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		// Unexpected database error - log it for debugging
		return nil, fmt.Errorf("failed to check if borrower exists: %w", err)
	}
	if existingBorrower != nil {
		return nil, errors.New("borrower with this email already exists")
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

	// Create borrower in "borrower" table (NOT "user" table)
	// Employees are created separately by admins via CreateEmployee method
	borrower, err := s.borrowerRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName, req.Phone)
	if err != nil {
		// Check if it's a unique constraint error that we already handle
		if strings.Contains(err.Error(), "borrower with this email already exists") {
			return nil, err
		}
		// Return the actual error for debugging
		return nil, fmt.Errorf("failed to create borrower: %w", err)
	}

	// Generate tokens - use Borrower ID as string for ID
	email := ""
	if borrower.EmailAddress.Valid {
		email = borrower.EmailAddress.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        borrower.ID,
			Email:     email,
			FirstName: borrower.FirstName,
			LastName:  borrower.LastName,
			UserType:  "applicant",
		},
	}, nil
}

// VerifyAndRegister verifies the code and creates a borrower account
// This is used for direct sign-up with 2FA
// NOTE: 2FA is currently disabled - verification code check is bypassed
func (s *AuthService) VerifyAndRegister(req VerifyAndRegisterRequest) (*AuthResponse, error) {
	// 2FA is disabled - skip verification code check
	// TODO: Re-enable when 2FA is needed
	// valid, err := s.borrowerRepo.VerifyCode(req.Email, req.VerificationCode)
	// if err != nil {
	// 	return nil, errors.New("failed to verify code")
	// }
	// if !valid {
	// 	return nil, errors.New("invalid or expired verification code")
	// }

	// Check if borrower already exists
	existingBorrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check if borrower exists: %w", err)
	}
	if existingBorrower != nil {
		return nil, errors.New("borrower with this email already exists")
	}

	// Check if employee with this email exists
	existingUser, err := s.userRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check if user exists: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("this email is already registered as an employee account")
	}

	// Validate password is not empty
	if req.Password == "" {
		return nil, errors.New("password cannot be empty")
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	
	// Validate hash was generated
	if passwordHash == "" {
		return nil, errors.New("password hash generation failed: empty hash")
	}

	// Create borrower in "borrower" table
	borrower, err := s.borrowerRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName, req.Phone)
	if err != nil {
		if strings.Contains(err.Error(), "borrower with this email already exists") {
			return nil, err
		}
		return nil, fmt.Errorf("failed to create borrower: %w", err)
	}

	// Clear verification code
	err = s.borrowerRepo.ClearVerificationCode(req.Email)
	if err != nil {
		// Log but don't fail
	}

	// Generate tokens
	email := ""
	if borrower.EmailAddress.Valid {
		email = borrower.EmailAddress.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        borrower.ID,
			Email:     email,
			FirstName: borrower.FirstName,
			LastName:  borrower.LastName,
			UserType:  "applicant",
		},
	}, nil
}

// SendLoginVerificationCode sends a verification code via email for login
func (s *AuthService) SendLoginVerificationCode(req SendLoginVerificationCodeRequest) error {
	// Check if user exists (borrower or employee)
	borrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return errors.New("failed to check if user exists")
	}
	
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return errors.New("failed to check if user exists")
	}
	
	if borrower == nil && user == nil {
		return errors.New("no account found with this email")
	}
	
	// Generate verification code
	code, err := utils.GenerateVerificationCode()
	if err != nil {
		return errors.New("failed to generate verification code")
	}
	
	// Store verification code (expires in 10 minutes)
	expiresAt := time.Now().Add(10 * time.Minute)
	
	// Store code in borrower table (works for both borrowers and employees)
	if borrower != nil {
		err = s.borrowerRepo.SetVerificationCode(req.Email, code, "email", expiresAt)
	} else {
		// For employees, we'd need to add verification code support to user table
		// For now, use borrower table if it exists, otherwise create a temporary record
		err = s.borrowerRepo.SetVerificationCode(req.Email, code, "email", expiresAt)
	}
	
	if err != nil {
		return errors.New("failed to store verification code")
	}
	
	// Send verification code via email
	emailService := NewEmailService(s.cfg)
	err = emailService.SendVerificationCode(req.Email, code)
	if err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	
	return nil
}

// Login authenticates a user (borrower or employee)
// First checks borrower table, then user table (employees)
// NOTE: 2FA is currently disabled - password-only authentication
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	// 2FA is disabled - skip verification code check
	// TODO: Re-enable when 2FA is needed
	// if req.VerificationCode != "" {
	// 	valid, err := s.borrowerRepo.VerifyCode(req.Email, req.VerificationCode)
	// 	if err != nil {
	// 		return nil, errors.New("failed to verify code")
	// 	}
	// 	if !valid {
	// 		return nil, errors.New("invalid or expired verification code")
	// 	}
	// } else {
	// 	return nil, errors.New("verification code required. Please request a verification code first.")
	// }
	
	// Try borrower login first
	borrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err == nil {
		// Found in borrower table - borrower login
		// Verify password
		if !borrower.PasswordHash.Valid {
			return nil, errors.New("invalid email or password")
		}

		if !utils.CheckPasswordHash(req.Password, borrower.PasswordHash.String) {
			return nil, errors.New("invalid email or password")
		}

		// Generate tokens
		email := ""
		if borrower.EmailAddress.Valid {
			email = borrower.EmailAddress.String
		}

		accessToken, err := s.jwtManager.GenerateAccessToken(borrower.ID, email)
		if err != nil {
			return nil, errors.New("failed to generate access token")
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(borrower.ID, email)
		if err != nil {
			return nil, errors.New("failed to generate refresh token")
		}

		return &AuthResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			User: UserResponse{
				ID:        borrower.ID,
				Email:     email,
				FirstName: borrower.FirstName,
				LastName:  borrower.LastName,
				UserType:  "applicant",
			},
		}, nil
	}

	// If error is not "not found", it's a database error
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("failed to check borrower account")
	}

	// Try employee login (user table)
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid email or password")
		}
		return nil, errors.New("failed to check user account")
	}

	// Found in user table - employee login
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

	// Try borrower (UserID is now a UUID string)
	borrower, err := s.borrowerRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, errors.New("borrower not found")
	}

	// Generate new tokens
	email := ""
	if borrower.EmailAddress.Valid {
		email = borrower.EmailAddress.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(borrower.ID, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:        borrower.ID,
			Email:     email,
			FirstName: borrower.FirstName,
			LastName:  borrower.LastName,
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

	// Check if borrower with this email exists
	existingBorrower, _ := s.borrowerRepo.GetByEmail(req.Email)
	if existingBorrower != nil {
		return nil, errors.New("email already registered as borrower")
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
