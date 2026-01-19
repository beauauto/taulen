package services

import (
	"fmt"
	"log"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
)

// LoanService handles loan-related operations
type LoanService struct {
	dealRepo   *repositories.DealRepository
	appService *ApplicationService
}

// NewLoanService creates a new loan service
func NewLoanService(cfg *config.Config) *LoanService {
	return &LoanService{
		dealRepo:   repositories.NewDealRepository(),
		appService: NewApplicationService(),
	}
}

// SaveLoanData saves loan information for an application
func (s *LoanService) SaveLoanData(dealID string, loanData map[string]interface{}, nextFormStep string) error {
	var loanAmount *float64
	var purchasePrice, downPayment *float64
	var propertyAddress *string
	var outstandingBalance *float64
	var isApplyingForOtherLoans, isDownPaymentPartGift *bool

	// Extract loan amount (required for both purchase and refinance)
	if val, ok := loanData["loanAmount"].(float64); ok && val > 0 {
		loanAmount = &val
	} else if valStr, ok := loanData["loanAmount"].(string); ok && valStr != "" {
		// Handle string conversion
		if parsed, err := parseFloatFromString(valStr); err == nil && parsed > 0 {
			loanAmount = &parsed
		}
	}

	// Extract purchase-specific fields
	if val, ok := loanData["purchasePrice"].(float64); ok && val > 0 {
		purchasePrice = &val
	} else if valStr, ok := loanData["purchasePrice"].(string); ok && valStr != "" {
		if parsed, err := parseFloatFromString(valStr); err == nil && parsed > 0 {
			purchasePrice = &parsed
		}
	}

	if val, ok := loanData["downPayment"].(float64); ok && val > 0 {
		downPayment = &val
	} else if valStr, ok := loanData["downPayment"].(string); ok && valStr != "" {
		if parsed, err := parseFloatFromString(valStr); err == nil && parsed > 0 {
			downPayment = &parsed
		}
	}

	// Extract refinance-specific fields
	if val, ok := loanData["propertyAddress"].(string); ok && val != "" {
		propertyAddress = &val
	}

	if val, ok := loanData["outstandingBalance"].(float64); ok && val > 0 {
		outstandingBalance = &val
	} else if valStr, ok := loanData["outstandingBalance"].(string); ok && valStr != "" {
		if parsed, err := parseFloatFromString(valStr); err == nil && parsed > 0 {
			outstandingBalance = &parsed
		}
	}

	// Extract boolean fields
	if val, ok := loanData["isApplyingForOtherLoans"].(bool); ok {
		isApplyingForOtherLoans = &val
	}
	if val, ok := loanData["isDownPaymentPartGift"].(bool); ok {
		isDownPaymentPartGift = &val
	}

	// Suppress unused variable warnings - these will be used when loan table is extended
	_ = purchasePrice
	_ = downPayment
	_ = propertyAddress
	_ = outstandingBalance
	_ = isApplyingForOtherLoans
	_ = isDownPaymentPartGift

	// Update loan in database
	// Note: loanPurpose is not updated here as it's set at application creation and cannot be changed
	err := s.dealRepo.UpdateLoan(dealID, nil, nil, nil, nil, loanAmount, nil, nil)
	if err != nil {
		log.Printf("SaveLoanData: Failed to update loan: %v", err)
		return fmt.Errorf("failed to update loan: %w", err)
	}

	// TODO: Store additional loan fields (purchasePrice, downPayment, propertyAddress, outstandingBalance,
	// isApplyingForOtherLoans, isDownPaymentPartGift) in a separate table or extend the loan table
	// For now, we're saving the essential loanAmount which is the primary field

	// Update current form step if provided
	if nextFormStep != "" {
		err = s.appService.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveLoanData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}
