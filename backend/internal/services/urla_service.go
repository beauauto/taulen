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

// URLAService handles URLA application business logic
// In the new schema, a mortgage application is called a "deal"
type URLAService struct {
	dealRepo         *repositories.DealRepository
	dealProgressRepo *repositories.DealProgressRepository
	userRepo         *repositories.UserRepository
	borrowerRepo     *repositories.BorrowerRepository
	jwtManager       *utils.JWTManager
	cfg              *config.Config
}

// NewURLAService creates a new URLA service
func NewURLAService(cfg *config.Config) *URLAService {
	return &URLAService{
		dealRepo:         repositories.NewDealRepository(),
		dealProgressRepo: repositories.NewDealProgressRepository(),
		userRepo:         repositories.NewUserRepository(),
		borrowerRepo:     repositories.NewBorrowerRepository(),
		jwtManager:       utils.NewJWTManager(&cfg.JWT),
		cfg:              cfg,
	}
}

// CreateApplicationRequest represents a request to create a new application
type CreateApplicationRequest struct {
	LoanType    string  `json:"loanType" binding:"required"`
	LoanPurpose string  `json:"loanPurpose" binding:"required"`
	LoanAmount  float64 `json:"loanAmount" binding:"required,gt=0"`
}

// ApplicationResponse represents an application in API responses
type ApplicationResponse struct {
	ID                  int64   `json:"id"`
	LoanType            string  `json:"loanType"`
	LoanPurpose         string  `json:"loanPurpose"`
	LoanAmount          float64 `json:"loanAmount"`
	Status              string  `json:"status"`
	CreatedDate         string  `json:"createdDate"`
	LastUpdatedDate     string  `json:"lastUpdatedDate"`
	ProgressPercentage  *int    `json:"progressPercentage,omitempty"`
	LastUpdatedSection    *string `json:"lastUpdatedSection,omitempty"`
}

// VerifyAndCreateBorrowerResponse represents the response after verification and account creation
type VerifyAndCreateBorrowerResponse struct {
	Application        ApplicationResponse        `json:"application"`
	AccessToken        string                     `json:"accessToken"`
	RefreshToken       string                     `json:"refreshToken"`
	User               AuthUserResponse          `json:"user"`
	PreApplicationData *PreApplicationDataResponse `json:"preApplicationData,omitempty"`
}

// AuthUserResponse represents user information (alias to avoid conflict with auth_service.UserResponse)
type AuthUserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	UserType  string `json:"userType"`
}

// PreApplicationDataResponse contains pre-application data for form pre-population
type PreApplicationDataResponse struct {
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	DateOfBirth string `json:"dateOfBirth"`
	Address     string `json:"address"`
	City        string `json:"city"`
	State       string `json:"state"`
	ZipCode     string `json:"zipCode"`
}

// CreateApplication creates a new URLA application
// userID is the employee (User) managing this application
// applicantID can be nil initially, set later when primary applicant is created
func (s *URLAService) CreateApplication(userID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
	// Verify user exists (must be an employee)
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Create deal (application) with UserID (employee) and NULL BorrowerID (set later)
	// Note: loanType is not used in new schema, only loanPurpose
	dealID, err := s.dealRepo.CreateDeal(userID, nil, req.LoanPurpose, req.LoanAmount, "Draft")
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	return &ApplicationResponse{
		ID:          dealID,
		LoanType:    req.LoanType,
		LoanPurpose: req.LoanPurpose,
		LoanAmount:  req.LoanAmount,
		Status:      "draft",
	}, nil
}

// GetApplication retrieves a deal (application) by ID
func (s *URLAService) GetApplication(dealID int64) (map[string]interface{}, error) {
	row, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		return nil, errors.New("deal not found")
	}

	var deal struct {
		ID                      int64
		LoanNumber              sql.NullString
		UniversalLoanIdentifier sql.NullString
		AgencyCaseIdentifier    sql.NullString
		ApplicationType         sql.NullString
		TotalBorrowers         sql.NullInt64
		ApplicationDate        sql.NullTime
		CreatedAt              sql.NullTime
		LoanID                 sql.NullInt64
		LoanPurposeType        sql.NullString
		LoanAmountRequested    sql.NullFloat64
		LoanTermMonths         sql.NullInt64
		InterestRatePercentage sql.NullFloat64
		PropertyType           sql.NullString
		ManufacturedHomeWidth  sql.NullString
		TitleMannerType        sql.NullString
	}

	err = row.Scan(
		&deal.ID, &deal.LoanNumber, &deal.UniversalLoanIdentifier, &deal.AgencyCaseIdentifier,
		&deal.ApplicationType, &deal.TotalBorrowers, &deal.ApplicationDate, &deal.CreatedAt,
		&deal.LoanID, &deal.LoanPurposeType, &deal.LoanAmountRequested, &deal.LoanTermMonths,
		&deal.InterestRatePercentage, &deal.PropertyType, &deal.ManufacturedHomeWidth, &deal.TitleMannerType,
	)
	if err != nil {
		return nil, errors.New("failed to retrieve deal")
	}

	result := make(map[string]interface{})
	result["id"] = deal.ID
	if deal.LoanNumber.Valid {
		result["loanNumber"] = deal.LoanNumber.String
	}
	if deal.LoanPurposeType.Valid {
		result["loanPurpose"] = deal.LoanPurposeType.String
	}
	if deal.LoanAmountRequested.Valid {
		result["loanAmount"] = deal.LoanAmountRequested.Float64
	}
	if deal.ApplicationType.Valid {
		result["applicationType"] = deal.ApplicationType.String
	}

	return result, nil
}

// UpdateApplicationStatus updates the status of an application
func (s *URLAService) UpdateApplicationStatus(applicationID int64, status string) error {
	validStatuses := map[string]bool{
		"draft": true, "submitted": true, "in_review": true,
		"approved": true, "denied": true, "withdrawn": true,
	}
	if !validStatuses[status] {
		return errors.New("invalid status")
	}

	// TODO: The new schema doesn't have application_status field
	// This needs to be added to the deal table or handled differently
	// For now, return nil as placeholder
	return nil
}

// GetApplicationsByEmployee retrieves all applications managed by an employee
func (s *URLAService) GetApplicationsByEmployee(userID string) ([]ApplicationResponse, error) {
	rows, err := s.dealRepo.GetDealsByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to retrieve applications")
	}
	defer rows.Close()

	var applications []ApplicationResponse
	for rows.Next() {
		var app struct {
			ID              int64
			ApplicantID     sql.NullInt64
			UserID          sql.NullString
			ApplicationDate sql.NullTime
			LoanType        sql.NullString
			LoanPurpose     sql.NullString
			LoanAmount      sql.NullFloat64
			Status          sql.NullString
			CreatedDate     sql.NullTime
			LastUpdatedDate sql.NullTime
		}

		err := rows.Scan(
			&app.ID, &app.ApplicantID, &app.UserID, &app.ApplicationDate,
			&app.LoanType, &app.LoanPurpose, &app.LoanAmount, &app.Status,
			&app.CreatedDate, &app.LastUpdatedDate,
		)
		if err != nil {
			continue
		}

		loanType := ""
		if app.LoanType.Valid {
			loanType = app.LoanType.String
		}
		loanPurpose := ""
		if app.LoanPurpose.Valid {
			loanPurpose = app.LoanPurpose.String
		}
		loanAmount := 0.0
		if app.LoanAmount.Valid {
			loanAmount = app.LoanAmount.Float64
		}
		status := ""
		if app.Status.Valid {
			status = app.Status.String
		}
		createdDate := ""
		if app.CreatedDate.Valid {
			createdDate = app.CreatedDate.Time.Format("2006-01-02T15:04:05Z07:00")
		}
		lastUpdatedDate := ""
		if app.LastUpdatedDate.Valid {
			lastUpdatedDate = app.LastUpdatedDate.Time.Format("2006-01-02T15:04:05Z07:00")
		}

		applications = append(applications, ApplicationResponse{
			ID:              app.ID,
			LoanType:        loanType,
			LoanPurpose:     loanPurpose,
			LoanAmount:      loanAmount,
			Status:          status,
			CreatedDate:     createdDate,
			LastUpdatedDate: lastUpdatedDate,
		})
	}

	return applications, rows.Err()
}

// GetApplicationsByBorrower retrieves all applications for a borrower
func (s *URLAService) GetApplicationsByBorrower(borrowerID int64) ([]ApplicationResponse, error) {
	rows, err := s.dealRepo.GetDealsByBorrowerID(borrowerID)
	if err != nil {
		return nil, errors.New("failed to retrieve applications")
	}
	defer rows.Close()

	var applications []ApplicationResponse
	for rows.Next() {
		var app struct {
			ID                int64
			LoanNumber        sql.NullString
			ApplicationType   sql.NullString
			ApplicationDate   sql.NullTime
			CreatedAt         sql.NullTime
			Status            sql.NullString
			LoanPurpose       sql.NullString
			LoanAmount        sql.NullFloat64
			LastUpdatedAt     sql.NullTime
			ProgressPercentage sql.NullInt64
			LastUpdatedSection sql.NullString
		}

		err := rows.Scan(
			&app.ID, &app.LoanNumber, &app.ApplicationType, &app.ApplicationDate,
			&app.CreatedAt, &app.Status, &app.LoanPurpose, &app.LoanAmount,
			&app.LastUpdatedAt, &app.ProgressPercentage, &app.LastUpdatedSection,
		)
		if err != nil {
			continue
		}

		loanPurpose := ""
		if app.LoanPurpose.Valid {
			loanPurpose = app.LoanPurpose.String
		}
		loanAmount := 0.0
		if app.LoanAmount.Valid {
			loanAmount = app.LoanAmount.Float64
		}
		status := "Draft"
		if app.Status.Valid {
			status = app.Status.String
		}
		createdDate := ""
		if app.CreatedAt.Valid {
			createdDate = app.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}
		lastUpdatedDate := ""
		if app.LastUpdatedAt.Valid {
			lastUpdatedDate = app.LastUpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}
		
		var progressPercentage *int
		if app.ProgressPercentage.Valid {
			pct := int(app.ProgressPercentage.Int64)
			progressPercentage = &pct
		}
		
		var lastUpdatedSection *string
		if app.LastUpdatedSection.Valid {
			section := app.LastUpdatedSection.String
			lastUpdatedSection = &section
		}

		applications = append(applications, ApplicationResponse{
			ID:                 app.ID,
			LoanType:           "Conventional", // Default, can be updated later
			LoanPurpose:        loanPurpose,
			LoanAmount:         loanAmount,
			Status:             status,
			CreatedDate:        createdDate,
			LastUpdatedDate:    lastUpdatedDate,
			ProgressPercentage: progressPercentage,
			LastUpdatedSection: lastUpdatedSection,
		})
	}

	return applications, rows.Err()
}

// CreateApplicationForBorrower creates a new application for a borrower
// This is called when a borrower starts a new application from the home page
func (s *URLAService) CreateApplicationForBorrower(borrowerID int64, req CreateApplicationRequest) (*ApplicationResponse, error) {
	// Verify borrower exists
	_, err := s.borrowerRepo.GetByID(borrowerID)
	if err != nil {
		return nil, errors.New("borrower not found")
	}

	// Create deal (application) - UserID can be NULL if no employee assigned yet
	// Note: The new schema uses deal/loan instead of loan_application
	dealID, err := s.dealRepo.CreateDeal("", &borrowerID, req.LoanPurpose, req.LoanAmount, "Draft")
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	// Update borrower's deal_id if it was NULL
	// This will be handled when the deal is created

	return &ApplicationResponse{
		ID:          dealID,
		LoanType:    req.LoanType,
		LoanPurpose: req.LoanPurpose,
		LoanAmount:  req.LoanAmount,
		Status:      "draft",
	}, nil
}

// SendVerificationCodeRequest represents a request to send verification code
// Phone is required. VerificationMethod is optional - if not provided, phone (SMS) will be used if available, otherwise email
type SendVerificationCodeRequest struct {
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"` // Phone is required for 2FA
	VerificationMethod string `json:"verificationMethod,omitempty"` // Optional: "email" or "sms". Auto-selected if not provided
}

// VerifyAndCreateBorrowerRequest represents pre-application data with verification
type VerifyAndCreateBorrowerRequest struct {
	Email          string  `json:"email" binding:"required,email"`
	FirstName      string  `json:"firstName" binding:"required"`
	LastName       string  `json:"lastName" binding:"required"`
	Phone          string  `json:"phone" binding:"required"`
	Password       string  `json:"password" binding:"required,min=8"`
	DateOfBirth    string  `json:"dateOfBirth" binding:"required"`
	Address        string  `json:"address"`
	City           string  `json:"city"`
	State          string  `json:"state"`
	ZipCode        string  `json:"zipCode"`
	EstimatedPrice float64 `json:"estimatedPrice"`
	DownPayment    float64 `json:"downPayment"`
	LoanPurpose    string  `json:"loanPurpose" binding:"required"`
	VerificationCode string `json:"verificationCode" binding:"required,len=6"`
}

// CreateBorrowerAndDealFromPreApplicationRequest represents pre-application data (deprecated)
type CreateBorrowerAndDealFromPreApplicationRequest struct {
	Email          string  `json:"email" binding:"required,email"`
	FirstName      string  `json:"firstName" binding:"required"`
	LastName       string  `json:"lastName" binding:"required"`
	Phone          string  `json:"phone" binding:"required"`
	DateOfBirth    string  `json:"dateOfBirth" binding:"required"`
	Address        string  `json:"address"`
	City           string  `json:"city"`
	State          string  `json:"state"`
	ZipCode        string  `json:"zipCode"`
	EstimatedPrice float64 `json:"estimatedPrice"`
	DownPayment    float64 `json:"downPayment"`
	LoanPurpose    string  `json:"loanPurpose" binding:"required"`
}

// SendVerificationCode sends a verification code via email or SMS
// Automatically selects phone if both email and phone are available (phone is preferred)
// Uses email if only email is available, phone if only phone is available
func (s *URLAService) SendVerificationCode(req SendVerificationCodeRequest) error {
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

// VerifyAndCreateBorrower verifies the code and creates borrower account with deal
// Returns auth tokens and application data for seamless login
func (s *URLAService) VerifyAndCreateBorrower(req VerifyAndCreateBorrowerRequest) (*VerifyAndCreateBorrowerResponse, error) {
	// Verify the code
	valid, err := s.borrowerRepo.VerifyCode(req.Email, req.VerificationCode)
	if err != nil {
		return nil, errors.New("failed to verify code")
	}
	if !valid {
		return nil, errors.New("invalid or expired verification code")
	}
	
	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}
	
	// Check if borrower already exists
	existingBorrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && err != sql.ErrNoRows {
		return nil, errors.New("failed to check if borrower exists")
	}
	
	var borrower *repositories.Borrower
	var borrowerID int64
	if existingBorrower != nil {
		// Borrower exists (from pre-application step), update with password
		borrowerID = existingBorrower.ID
		// Update password if it doesn't exist
		if !existingBorrower.PasswordHash.Valid || existingBorrower.PasswordHash.String == "" {
			err = s.borrowerRepo.UpdatePassword(borrowerID, passwordHash)
			if err != nil {
				return nil, errors.New("failed to update borrower password: " + err.Error())
			}
		}
		// Update name if needed
		if existingBorrower.FirstName != req.FirstName || existingBorrower.LastName != req.LastName {
			err = s.borrowerRepo.UpdateName(borrowerID, req.FirstName, req.LastName)
			if err != nil {
				// Log but don't fail
			}
		}
		// Fetch updated borrower
		borrower, err = s.borrowerRepo.GetByID(borrowerID)
		if err != nil {
			return nil, errors.New("failed to fetch borrower: " + err.Error())
		}
	} else {
		// Create new borrower with password
		newBorrower, err := s.borrowerRepo.Create(req.Email, passwordHash, req.FirstName, req.LastName, req.Phone)
		if err != nil {
			return nil, errors.New("failed to create borrower: " + err.Error())
		}
		borrower = newBorrower
		borrowerID = newBorrower.ID
	}
	
	// Clear verification code
	err = s.borrowerRepo.ClearVerificationCode(req.Email)
	if err != nil {
		// Log but don't fail
	}
	
	// Generate JWT tokens for seamless login
	borrowerIDStr := utils.Int64ToString(borrowerID)
	email := ""
	if borrower.EmailAddress.Valid {
		email = borrower.EmailAddress.String
	}
	
	accessToken, err := s.jwtManager.GenerateAccessToken(borrowerIDStr, email)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}
	
	refreshToken, err := s.jwtManager.GenerateRefreshToken(borrowerIDStr, email)
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
	
	// Calculate loan amount
	loanAmount := req.EstimatedPrice - req.DownPayment
	if loanAmount <= 0 {
		loanAmount = req.EstimatedPrice
	}
	
	// Create deal in draft status
	dealID, err := s.dealRepo.CreateDeal("", &borrowerID, req.LoanPurpose, loanAmount, "Draft")
	if err != nil {
		return nil, errors.New("failed to create application")
	}
	
	// Create subject property record if property information is provided
	// Use location from pre-application or address if available
	propertyAddress := req.Address
	propertyCity := req.City
	propertyState := req.State
	propertyZip := req.ZipCode
	
	// If we have estimated price, create subject property
	if req.EstimatedPrice > 0 {
		// If we don't have a specific address, use location field or leave empty
		if propertyAddress == "" {
			// Could use location field if available, but for now leave empty
			// The property address can be filled in later during the full application
		}
		_, err = s.dealRepo.CreateSubjectProperty(dealID, propertyAddress, propertyCity, propertyState, propertyZip, req.EstimatedPrice)
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
			ID:        borrowerIDStr,
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

// CreateBorrowerAndDealFromPreApplication creates a borrower and deal from pre-application data
// DEPRECATED: Use VerifyAndCreateBorrower instead
func (s *URLAService) CreateBorrowerAndDealFromPreApplication(req CreateBorrowerAndDealFromPreApplicationRequest) (*ApplicationResponse, error) {
	// Check if borrower already exists by email
	existingBorrower, err := s.borrowerRepo.GetByEmail(req.Email)
	if err != nil && err != sql.ErrNoRows {
		return nil, errors.New("failed to check if borrower exists")
	}

	var borrowerID int64
	if existingBorrower != nil {
		// Borrower already exists, use existing ID
		borrowerID = existingBorrower.ID
	} else {
		// Create new borrower from pre-application data
		borrower, err := s.borrowerRepo.CreateFromPreApplication(
			req.Email,
			req.FirstName,
			req.LastName,
			req.Phone,
			req.DateOfBirth,
			req.Address,
			req.City,
			req.State,
			req.ZipCode,
		)
		if err != nil {
			return nil, errors.New("failed to create borrower: " + err.Error())
		}
		borrowerID = borrower.ID
	}

	// Calculate loan amount (estimated price - down payment)
	loanAmount := req.EstimatedPrice - req.DownPayment
	if loanAmount <= 0 {
		loanAmount = req.EstimatedPrice // Fallback to full price if down payment >= price
	}

	// Create deal in draft status
	dealID, err := s.dealRepo.CreateDeal("", &borrowerID, req.LoanPurpose, loanAmount, "Draft")
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	return &ApplicationResponse{
		ID:          dealID,
		LoanType:    "Conventional", // Default, can be updated later
		LoanPurpose: req.LoanPurpose,
		LoanAmount:  loanAmount,
		Status:      "Draft",
	}, nil
}

// GetDealProgress retrieves progress for a deal
func (s *URLAService) GetDealProgress(dealID int64) (map[string]interface{}, error) {
	progress, err := s.dealProgressRepo.GetByDealID(dealID)
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	result["dealId"] = progress.DealID
	result["progressPercentage"] = progress.ProgressPercentage
	result["lastUpdatedSection"] = nil
	if progress.LastUpdatedSection.Valid {
		result["lastUpdatedSection"] = progress.LastUpdatedSection.String
	}
	result["lastUpdatedAt"] = nil
	if progress.LastUpdatedAt.Valid {
		result["lastUpdatedAt"] = progress.LastUpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
	}
	result["progressNotes"] = nil
	if progress.ProgressNotes.Valid {
		result["progressNotes"] = progress.ProgressNotes.String
	}

	// Section completion flags
	sections := make(map[string]bool)
	sections["section1a"] = progress.Section1aComplete
	sections["section1b"] = progress.Section1bComplete
	sections["section1c"] = progress.Section1cComplete
	sections["section1d"] = progress.Section1dComplete
	sections["section1e"] = progress.Section1eComplete
	sections["section2a"] = progress.Section2aComplete
	sections["section2b"] = progress.Section2bComplete
	sections["section2c"] = progress.Section2cComplete
	sections["section2d"] = progress.Section2dComplete
	sections["section3"] = progress.Section3Complete
	sections["section4"] = progress.Section4Complete
	sections["section5"] = progress.Section5Complete
	sections["section6"] = progress.Section6Complete
	sections["section7"] = progress.Section7Complete
	sections["section8"] = progress.Section8Complete
	sections["section9"] = progress.Section9Complete
	sections["lenderL1"] = progress.LenderL1Complete
	sections["lenderL2"] = progress.LenderL2Complete
	sections["lenderL3"] = progress.LenderL3Complete
	sections["lenderL4"] = progress.LenderL4Complete
	sections["continuation"] = progress.ContinuationComplete
	sections["unmarriedAddendum"] = progress.UnmarriedAddendumComplete
	result["sections"] = sections

	// Get next incomplete section for resumption
	nextSection, err := s.dealProgressRepo.GetNextIncompleteSection(dealID)
	if err == nil {
		result["nextIncompleteSection"] = nextSection
	}

	return result, nil
}

// UpdateDealProgressSection updates a specific section's completion status
func (s *URLAService) UpdateDealProgressSection(dealID int64, section string, complete bool) error {
	return s.dealProgressRepo.UpdateSection(dealID, section, complete)
}

// UpdateDealProgressNotes updates progress notes
func (s *URLAService) UpdateDealProgressNotes(dealID int64, notes string) error {
	return s.dealProgressRepo.UpdateNotes(dealID, notes)
}
