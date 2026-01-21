package services

import (
	"database/sql"
	"errors"
	"log"
	"strings"
	"time"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
	"taulen/backend/internal/utils"
)

// BorrowerService handles borrower-related operations
type BorrowerService struct {
	dealRepo     *repositories.DealRepository
	borrowerRepo *repositories.BorrowerRepository
	jwtManager   *utils.JWTManager
	appService   *ApplicationService
}

// NewBorrowerService creates a new borrower service
func NewBorrowerService(cfg *config.Config) *BorrowerService {
	return &BorrowerService{
		dealRepo:     repositories.NewDealRepository(),
		borrowerRepo: repositories.NewBorrowerRepository(),
		jwtManager:   utils.NewJWTManager(&cfg.JWT),
		appService:   NewApplicationService(),
	}
}

// VerifyAndCreateBorrower verifies the code and creates borrower account with deal
// Returns auth tokens and application data for seamless login
// NOTE: 2FA is currently disabled - verification code is optional
func (s *BorrowerService) VerifyAndCreateBorrower(req VerifyAndCreateBorrowerRequest) (*VerifyAndCreateBorrowerResponse, error) {
	// 2FA is disabled - skip verification code check
	// if req.VerificationCode != "" {
	// 	valid, err := s.borrowerRepo.VerifyCode(req.Email, req.VerificationCode)
	// 	if err != nil {
	// 		return nil, errors.New("failed to verify code")
	// 	}
	// 	if !valid {
	// 		return nil, errors.New("invalid or expired verification code")
	// 	}
	// }

	// Check if borrower already exists by email
	existingBorrowerByEmail, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && err != sql.ErrNoRows {
		return nil, errors.New("failed to check if borrower exists by email")
	}

	// Check if borrower already exists by phone
	existingBorrowerByPhone, err := s.borrowerRepo.GetByPhone(req.Phone)
	if err != nil && err != sql.ErrNoRows {
		return nil, errors.New("failed to check if borrower exists by phone")
	}

	// If borrower exists by email or phone, return error
	if existingBorrowerByEmail != nil {
		return nil, errors.New("borrower with this email already exists")
	}
	if existingBorrowerByPhone != nil {
		return nil, errors.New("borrower with this phone number already exists")
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Determine initial phone value for Create (default to mobile_phone)
	initialPhone := req.Phone
	if initialPhone == "" {
		initialPhone = "" // Will be set in UpdateBorrowerDetails
	}

	// Create new borrower with password
	// Phone will be properly set based on phoneType in UpdateBorrowerDetails
	newBorrower, err := s.borrowerRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName, initialPhone)
	if err != nil {
		return nil, errors.New("failed to create borrower: " + err.Error())
	}
	borrowerID := newBorrower.ID

	// Update borrower details (middle name, suffix, marital status, phone)
	var middleNamePtr, suffixPtr, maritalStatusPtr *string
	var phonePtr, phoneTypePtr *string

	if req.MiddleName != "" {
		middleNamePtr = &req.MiddleName
	}
	if req.Suffix != "" {
		suffixPtr = &req.Suffix
	}
	if req.MaritalStatus != "" {
		maritalStatusPtr = &req.MaritalStatus
	}
	if req.Phone != "" {
		phonePtr = &req.Phone
	}
	if req.PhoneType != "" {
		phoneTypePtr = &req.PhoneType
	} else {
		// Default to MOBILE if not specified
		defaultPhoneType := "MOBILE"
		phoneTypePtr = &defaultPhoneType
	}

	err = s.borrowerRepo.UpdateBorrowerDetails(borrowerID, middleNamePtr, suffixPtr, maritalStatusPtr, phonePtr, phoneTypePtr)
	if err != nil {
		// Log but don't fail - details can be updated later
	}

	// Fetch updated borrower
	borrower, err := s.borrowerRepo.GetByID(borrowerID)
	if err != nil {
		return nil, errors.New("failed to fetch borrower: " + err.Error())
	}

	// Generate JWT tokens for seamless login
	email := ""
	if borrower.EmailAddress.Valid {
		email = borrower.EmailAddress.String
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(borrowerID, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(borrowerID, email)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	// Update borrower with date of birth if provided
	if req.DateOfBirth != "" {
		birthDate, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err == nil {
			err = s.borrowerRepo.UpdateBorrowerInfo(borrowerID, &birthDate)
			if err != nil {
				// Log but don't fail
			}
		}
	}

	// Create current residence record for borrower if address provided
	if req.Address != "" && req.City != "" && req.State != "" && req.ZipCode != "" {
		_, err = s.borrowerRepo.CreateResidence(borrowerID, "BorrowerCurrentResidence", req.Address, req.City, req.State, req.ZipCode)
		if err != nil {
			// Log but don't fail - residence can be added later
		}
	}

	// Calculate loan amount based on loan purpose
	var loanAmount float64
	var propertyAddress, propertyCity, propertyState, propertyZip string
	var propertyValue float64

	if req.LoanPurpose == "Purchase" || req.LoanPurpose == "purchase" {
		// For purchase: use purchase price, down payment, and loan amount
		if req.LoanAmount > 0 {
			loanAmount = req.LoanAmount
		} else if req.PurchasePrice > 0 {
			loanAmount = req.PurchasePrice - req.DownPayment
			if loanAmount <= 0 {
				loanAmount = req.PurchasePrice
			}
		} else if req.EstimatedPrice > 0 {
			// Legacy support
			loanAmount = req.EstimatedPrice - req.DownPayment
			if loanAmount <= 0 {
				loanAmount = req.EstimatedPrice
			}
		}

		// Property address for purchase (can be empty initially)
		propertyAddress = req.Address
		propertyCity = req.City
		propertyState = req.State
		propertyZip = req.ZipCode

		if req.PurchasePrice > 0 {
			propertyValue = req.PurchasePrice
		} else if req.EstimatedPrice > 0 {
			propertyValue = req.EstimatedPrice
		}
	} else if req.LoanPurpose == "Refinance" || req.LoanPurpose == "refinance" {
		// For refinance: use outstanding balance as loan amount
		loanAmount = req.OutstandingBalance

		// Parse property address from Refinance form
		// Property address format: "Street Address, City, State Zip Code"
		if req.PropertyAddress != "" {
			// Try to parse the address
			// For now, store the full address and parse later if needed
			propertyAddress = req.PropertyAddress
			// Could parse city, state, zip from the address string if needed
		}

		propertyValue = req.OutstandingBalance // Use outstanding balance as property value estimate
	} else {
		// Default/legacy behavior
		loanAmount = req.EstimatedPrice - req.DownPayment
		if loanAmount <= 0 {
			loanAmount = req.EstimatedPrice
		}
		propertyAddress = req.Address
		propertyCity = req.City
		propertyState = req.State
		propertyZip = req.ZipCode
		propertyValue = req.EstimatedPrice
	}

	// Create deal in draft status
	dealID, err := s.dealRepo.CreateDeal("", &borrowerID, req.LoanPurpose, loanAmount, "Draft")
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	// Set initial form step to borrower-info-2 (next form after borrower-info-1)
	err = s.appService.UpdateCurrentFormStep(dealID, "borrower-info-2")
	if err != nil {
		log.Printf("VerifyAndCreateBorrower: Failed to set initial form step: %v", err)
		// Don't fail the entire operation if step update fails
	}

	// Create subject property record if property information is provided
	if propertyValue > 0 {
		_, err = s.dealRepo.CreateSubjectProperty(dealID, propertyAddress, propertyCity, propertyState, propertyZip, propertyValue)
		if err != nil {
			// Log but don't fail - property can be added later
		}
	}

	return &VerifyAndCreateBorrowerResponse{
		Application: ApplicationResponse{
			ID:          dealID,
			LoanType:    "Conventional",
			LoanPurpose: req.LoanPurpose,
			LoanAmount:  loanAmount,
			Status:      "Draft",
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: AuthUserResponse{
			ID:        borrowerID,
			Email:     email,
			FirstName: borrower.FirstName,
			LastName:  borrower.LastName,
			UserType:  "applicant",
		},
		PreApplicationData: &PreApplicationDataResponse{
			FirstName:   req.FirstName,
			LastName:    req.LastName,
			Email:       req.Email,
			Phone:       req.Phone,
			DateOfBirth: req.DateOfBirth,
			Address:     req.Address,
			City:        req.City,
			State:       req.State,
			ZipCode:     req.ZipCode,
		},
	}, nil
}

// SaveBorrowerData saves borrower information from the form
// nextFormStep is the form step to navigate to after saving (e.g., "borrower-info-2", "co-borrower-question")
func (s *BorrowerService) SaveBorrowerData(dealID string, borrowerData map[string]interface{}, nextFormStep string) error {
	// Get the deal to find the borrower ID
	dealRow, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		return errors.New("deal not found")
	}

	// Scan the deal row to get primary_borrower_id
	var deal struct {
		ID                      string
		LoanNumber              sql.NullString
		UniversalLoanIdentifier sql.NullString
		AgencyCaseIdentifier    sql.NullString
		ApplicationType         sql.NullString
		TotalBorrowers          sql.NullInt64
		ApplicationDate         sql.NullTime
		CreatedAt               sql.NullTime
		PrimaryBorrowerID       sql.NullString
		CurrentFormStep         sql.NullString
		LoanID                  sql.NullString
		LoanPurposeType         sql.NullString
		LoanAmountRequested     sql.NullFloat64
		LoanTermMonths          sql.NullInt64
		InterestRatePercentage  sql.NullFloat64
		PropertyType            sql.NullString
		ManufacturedHomeWidth   sql.NullString
		TitleMannerType         sql.NullString
	}

	err = dealRow.Scan(
		&deal.ID, &deal.LoanNumber, &deal.UniversalLoanIdentifier, &deal.AgencyCaseIdentifier,
		&deal.ApplicationType, &deal.TotalBorrowers, &deal.ApplicationDate, &deal.CreatedAt, &deal.PrimaryBorrowerID,
		&deal.CurrentFormStep,
		&deal.LoanID, &deal.LoanPurposeType, &deal.LoanAmountRequested, &deal.LoanTermMonths,
		&deal.InterestRatePercentage, &deal.PropertyType, &deal.ManufacturedHomeWidth, &deal.TitleMannerType,
	)
	if err != nil {
		return errors.New("failed to read deal: " + err.Error())
	}

	if !deal.PrimaryBorrowerID.Valid {
		return errors.New("no borrower associated with this deal")
	}

	borrowerID := deal.PrimaryBorrowerID.String

	// Extract borrower-info-2 fields only
	// Note: firstName, lastName, email, phone, phoneType, middleName, suffix, ssn, dateOfBirth, 
	// dependentsCount, citizenshipStatus belong to borrower-info-1 and should NOT be updated here
	var maritalStatus *string

	if val, ok := borrowerData["maritalStatus"].(string); ok && val != "" {
		// Normalize marital status to match database constraint (capitalized: "Married", "Separated", "Unmarried")
		normalized := normalizeMaritalStatus(val)
		maritalStatus = &normalized
	}

	// Update marital status if provided
	if maritalStatus != nil {
		err = s.borrowerRepo.UpdateBorrowerDetails(borrowerID, nil, nil, maritalStatus, nil, nil)
		if err != nil {
			return errors.New("failed to update marital status: " + err.Error())
		}
	}

	// Save address to residence table
	// Check if address components are provided directly first, otherwise parse from currentAddress
	var street, city, state, zipCode string
	var hasAddress bool

	if addr, ok := borrowerData["address"].(string); ok && addr != "" {
		street = addr
		if c, ok := borrowerData["city"].(string); ok && c != "" {
			city = c
		}
		if s, ok := borrowerData["state"].(string); ok && s != "" {
			state = s
		}
		if z, ok := borrowerData["zipCode"].(string); ok && z != "" {
			zipCode = z
		}
		hasAddress = street != "" && city != "" && state != "" && zipCode != ""
	} else if currentAddress, ok := borrowerData["currentAddress"].(string); ok && currentAddress != "" {
		// Parse address from format "Street, City, State Zip"
		parts := strings.Split(currentAddress, ",")
		if len(parts) >= 3 {
			street = strings.TrimSpace(parts[0])
			city = strings.TrimSpace(parts[1])
			stateZip := strings.TrimSpace(parts[2])
			stateZipParts := strings.Fields(stateZip)
			if len(stateZipParts) >= 2 {
				state = stateZipParts[0]
				zipCode = strings.Join(stateZipParts[1:], " ")
				hasAddress = true
			}
		}
	}

	if hasAddress {
		err = s.borrowerRepo.UpdateOrCreateResidence(borrowerID, "BorrowerCurrentResidence", street, city, state, zipCode)
		if err != nil {
			return errors.New("failed to save address: " + err.Error())
		}
	}

	// Save military service status and consents
	var militaryServiceStatus, consentToCreditCheck, consentToContact *bool

	if val, ok := borrowerData["isVeteran"].(bool); ok {
		militaryServiceStatus = &val
	}
	if val, ok := borrowerData["acceptTerms"].(bool); ok {
		consentToCreditCheck = &val
	}
	if val, ok := borrowerData["consentToContact"].(bool); ok {
		consentToContact = &val
	}

	if militaryServiceStatus != nil || consentToCreditCheck != nil || consentToContact != nil {
		err = s.borrowerRepo.UpdateBorrowerConsentsAndMilitary(borrowerID, militaryServiceStatus, consentToCreditCheck, consentToContact)
		if err != nil {
			return errors.New("failed to save consents and military status: " + err.Error())
		}
	}

	// Update current form step if provided
	if nextFormStep != "" {
		err = s.appService.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveBorrowerData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}
