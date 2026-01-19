package services

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
	"taulen/backend/internal/utils"
)

// VerificationService handles verification code operations
type VerificationService struct {
	borrowerRepo *repositories.BorrowerRepository
	cfg          *config.Config
}

// NewVerificationService creates a new verification service
func NewVerificationService(cfg *config.Config) *VerificationService {
	return &VerificationService{
		borrowerRepo: repositories.NewBorrowerRepository(),
		cfg:          cfg,
	}
}

// SendVerificationCode sends a verification code via email or SMS
// Automatically selects phone if both email and phone are available (phone is preferred)
// Uses email if only email is available, phone if only phone is available
func (s *VerificationService) SendVerificationCode(req SendVerificationCodeRequest) error {
	emailService := NewEmailService(s.cfg)
	smsService := NewSMSService(s.cfg)

	// Determine verification method automatically:
	// 1. If both email and phone are available, prefer phone (SMS)
	// 2. If only phone is available, use phone (SMS)
	// 3. If only email is available, use email
	verificationMethod := req.VerificationMethod
	if verificationMethod == "" {
		if req.Phone != "" {
			verificationMethod = "sms" // Prefer phone when available
		} else if req.Email != "" {
			verificationMethod = "email"
		} else {
			return errors.New("either email or phone must be provided")
		}
	}

	// Validate phone is provided if SMS is selected
	if verificationMethod == "sms" && req.Phone == "" {
		return errors.New("phone number is required for SMS verification")
	}

	// Validate email is provided if email is selected
	if verificationMethod == "email" && req.Email == "" {
		return errors.New("email is required for email verification")
	}

	// Generate 6-digit verification code
	code, err := utils.GenerateVerificationCode()
	if err != nil {
		return errors.New("failed to generate verification code")
	}

	// Store verification code (expires in 10 minutes)
	expiresAt := time.Now().Add(10 * time.Minute)

	// Check if borrower exists, if not create a temporary record
	existingBorrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && err != sql.ErrNoRows {
		return errors.New("failed to check if borrower exists")
	}

	if existingBorrower == nil {
		// Create temporary borrower record (without password)
		_, err = s.borrowerRepo.CreateFromPreApplication(
			req.Email,
			"", // First name - will be set later
			"", // Last name - will be set later
			req.Phone,
			"", // Date of birth - will be set later
			"", "", "", "", // Address fields
		)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			// If it's not a "not found" error, it might be a duplicate - continue
			if !errors.Is(err, sql.ErrNoRows) {
				// Try to update existing record instead
			}
		}
	}

	// Store verification code
	err = s.borrowerRepo.SetVerificationCode(req.Email, code, verificationMethod, expiresAt)
	if err != nil {
		return errors.New("failed to store verification code")
	}

	// Send verification code via selected method
	if verificationMethod == "email" {
		err = emailService.SendVerificationCode(req.Email, code)
	} else {
		err = smsService.SendVerificationCode(req.Phone, code)
	}

	if err != nil {
		// Return the actual error message from SMS/Email service for better debugging
		return fmt.Errorf("failed to send verification code: %w", err)
	}

	return nil
}
