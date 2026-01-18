package services

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
	"taulen/backend/internal/utils"
)

// normalizeMaritalStatus normalizes marital status to match database constraint
// Database expects: "Married", "Separated", "Unmarried" (capitalized)
// Frontend sends: "MARRIED", "SEPARATED", "UNMARRIED" (uppercase)
func normalizeMaritalStatus(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	if len(status) == 0 {
		return status
	}
	// Capitalize first letter
	return strings.ToUpper(status[:1]) + status[1:]
}

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
	log.Printf("GetApplication: Fetching application %d", dealID)
	row, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		log.Printf("GetApplication: Error fetching deal %d: %v", dealID, err)
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
		PrimaryBorrowerID      sql.NullInt64
		CurrentFormStep        sql.NullString
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
		&deal.ApplicationType, &deal.TotalBorrowers, &deal.ApplicationDate, &deal.CreatedAt, &deal.PrimaryBorrowerID,
		&deal.CurrentFormStep,
		&deal.LoanID, &deal.LoanPurposeType, &deal.LoanAmountRequested, &deal.LoanTermMonths,
		&deal.InterestRatePercentage, &deal.PropertyType, &deal.ManufacturedHomeWidth, &deal.TitleMannerType,
	)
	if err != nil {
		log.Printf("GetApplication: Error scanning deal %d: %v", dealID, err)
		return nil, errors.New("failed to retrieve deal")
	}

	primaryBorrowerIDValue := int64(0)
	if deal.PrimaryBorrowerID.Valid {
		primaryBorrowerIDValue = deal.PrimaryBorrowerID.Int64
	}
	log.Printf("GetApplication: Deal %d - PrimaryBorrowerID.Valid=%v, PrimaryBorrowerID.Int64=%d", 
		dealID, deal.PrimaryBorrowerID.Valid, primaryBorrowerIDValue)

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
	if deal.CurrentFormStep.Valid {
		result["currentFormStep"] = deal.CurrentFormStep.String
	}

	// Fetch borrower data if primary_borrower_id exists
	if deal.PrimaryBorrowerID.Valid {
		log.Printf("GetApplication: Fetching borrower data for borrower ID %d", deal.PrimaryBorrowerID.Int64)
		borrower, err := s.borrowerRepo.GetByID(deal.PrimaryBorrowerID.Int64)
		if err != nil {
			log.Printf("GetApplication: Error fetching borrower %d: %v", deal.PrimaryBorrowerID.Int64, err)
		} else if borrower != nil {
			borrowerEmail := ""
			if borrower.EmailAddress.Valid {
				borrowerEmail = borrower.EmailAddress.String
			}
			log.Printf("GetApplication: Found borrower %d - firstName=%s, lastName=%s, email=%s", 
				borrower.ID, borrower.FirstName, borrower.LastName, borrowerEmail)
			borrowerData := make(map[string]interface{})
			borrowerData["firstName"] = borrower.FirstName
			if borrower.MiddleName.Valid {
				borrowerData["middleName"] = borrower.MiddleName.String
			}
			borrowerData["lastName"] = borrower.LastName
			if borrower.Suffix.Valid {
				borrowerData["suffix"] = borrower.Suffix.String
			}
			if borrower.EmailAddress.Valid {
				borrowerData["email"] = borrower.EmailAddress.String
			}
			if borrower.MobilePhone.Valid && borrower.MobilePhone.String != "" {
				borrowerData["phone"] = borrower.MobilePhone.String
				borrowerData["phoneType"] = "MOBILE"
			} else if borrower.HomePhone.Valid && borrower.HomePhone.String != "" {
				borrowerData["phone"] = borrower.HomePhone.String
				borrowerData["phoneType"] = "HOME"
			} else if borrower.WorkPhone.Valid && borrower.WorkPhone.String != "" {
				borrowerData["phone"] = borrower.WorkPhone.String
				borrowerData["phoneType"] = "WORK"
			}
			if borrower.BirthDate.Valid {
				borrowerData["dateOfBirth"] = borrower.BirthDate.Time.Format("2006-01-02")
			}
			if borrower.MaritalStatus.Valid {
				borrowerData["maritalStatus"] = borrower.MaritalStatus.String
			}
			// Always include boolean fields, even if NULL (default to false)
			// This ensures the frontend can distinguish between "not set" and "false"
			if borrower.MilitaryServiceStatus.Valid {
				borrowerData["militaryServiceStatus"] = borrower.MilitaryServiceStatus.Bool
				borrowerData["isVeteran"] = borrower.MilitaryServiceStatus.Bool
			} else {
				// Field is NULL - explicitly set to false so frontend knows it's not set
				borrowerData["militaryServiceStatus"] = false
				borrowerData["isVeteran"] = false
			}
			if borrower.ConsentToCreditCheck.Valid {
				borrowerData["consentToCreditCheck"] = borrower.ConsentToCreditCheck.Bool
				borrowerData["acceptTerms"] = borrower.ConsentToCreditCheck.Bool
			} else {
				// Field is NULL - explicitly set to false so frontend knows it's not set
				borrowerData["consentToCreditCheck"] = false
				borrowerData["acceptTerms"] = false
			}
			if borrower.ConsentToContact.Valid {
				borrowerData["consentToContact"] = borrower.ConsentToContact.Bool
			} else {
				// Field is NULL - explicitly set to false so frontend knows it's not set
				borrowerData["consentToContact"] = false
			}
			
			// Fetch current residence/address from residence table
			addr, city, state, zipCode, err := s.borrowerRepo.GetCurrentResidence(deal.PrimaryBorrowerID.Int64)
			if err != nil {
				log.Printf("Error fetching residence for borrower %d: %v", deal.PrimaryBorrowerID.Int64, err)
			} else {
				log.Printf("Residence data for borrower %d: addr=%s, city=%s, state=%s, zip=%s", 
					deal.PrimaryBorrowerID.Int64, addr, city, state, zipCode)
				// Combine address components into a single string
				addressParts := []string{}
				if strings.TrimSpace(addr) != "" {
					addressParts = append(addressParts, strings.TrimSpace(addr))
				}
				if strings.TrimSpace(city) != "" || strings.TrimSpace(state) != "" || strings.TrimSpace(zipCode) != "" {
					cityStateZip := []string{}
					if strings.TrimSpace(city) != "" {
						cityStateZip = append(cityStateZip, strings.TrimSpace(city))
					}
					if strings.TrimSpace(state) != "" {
						cityStateZip = append(cityStateZip, strings.TrimSpace(state))
					}
					if strings.TrimSpace(zipCode) != "" {
						cityStateZip = append(cityStateZip, strings.TrimSpace(zipCode))
					}
					if len(cityStateZip) > 0 {
						addressParts = append(addressParts, strings.Join(cityStateZip, ", "))
					}
				}
				// Set currentAddress if we have any address parts
				if len(addressParts) > 0 {
					fullAddress := strings.Join(addressParts, ", ")
					borrowerData["currentAddress"] = fullAddress
					log.Printf("Synthesized currentAddress for borrower %d: %s", deal.PrimaryBorrowerID.Int64, fullAddress)
				} else {
					log.Printf("No address parts found for borrower %d (addr=%s, city=%s, state=%s, zip=%s)", 
						deal.PrimaryBorrowerID.Int64, addr, city, state, zipCode)
				}
			}
			
			result["borrower"] = borrowerData
			log.Printf("GetApplication: Added borrower data to result for application %d", dealID)
		} else {
			log.Printf("GetApplication: Borrower not found or error for borrower ID %d", deal.PrimaryBorrowerID.Int64)
		}
		
		// Fetch co-borrower data - always try to fetch if primary borrower exists
		// This is more robust than checking TotalBorrowers which might be NULL
		log.Printf("GetApplication: Attempting to fetch co-borrower data for deal %d (total borrowers: %v)", 
			dealID, deal.TotalBorrowers)
		coBorrowers, err := s.borrowerRepo.GetCoBorrowersByDealID(dealID, deal.PrimaryBorrowerID.Int64)
		if err != nil {
			log.Printf("GetApplication: Error fetching co-borrowers for deal %d: %v", dealID, err)
		} else {
			log.Printf("GetApplication: Found %d co-borrower(s) for deal %d", len(coBorrowers), dealID)
			if len(coBorrowers) > 0 {
				// For now, we only support one co-borrower, so take the first one
				coBorrower := coBorrowers[0]
				coBorrowerData := make(map[string]interface{})
				coBorrowerData["firstName"] = coBorrower.FirstName
				if coBorrower.MiddleName.Valid {
					coBorrowerData["middleName"] = coBorrower.MiddleName.String
				}
				coBorrowerData["lastName"] = coBorrower.LastName
				if coBorrower.Suffix.Valid {
					coBorrowerData["suffix"] = coBorrower.Suffix.String
				}
				if coBorrower.EmailAddress.Valid {
					coBorrowerData["email"] = coBorrower.EmailAddress.String
				}
				if coBorrower.MobilePhone.Valid && coBorrower.MobilePhone.String != "" {
					coBorrowerData["phone"] = coBorrower.MobilePhone.String
					coBorrowerData["phoneType"] = "MOBILE"
				} else if coBorrower.HomePhone.Valid && coBorrower.HomePhone.String != "" {
					coBorrowerData["phone"] = coBorrower.HomePhone.String
					coBorrowerData["phoneType"] = "HOME"
				} else if coBorrower.WorkPhone.Valid && coBorrower.WorkPhone.String != "" {
					coBorrowerData["phone"] = coBorrower.WorkPhone.String
					coBorrowerData["phoneType"] = "WORK"
				}
				if coBorrower.MaritalStatus.Valid {
					coBorrowerData["maritalStatus"] = coBorrower.MaritalStatus.String
				}
				if coBorrower.MilitaryServiceStatus.Valid {
					coBorrowerData["isVeteran"] = coBorrower.MilitaryServiceStatus.Bool
				} else {
					coBorrowerData["isVeteran"] = false
				}
				
				// Fetch co-borrower address
				addr, city, state, zipCode, err := s.borrowerRepo.GetCurrentResidence(coBorrower.ID)
				if err == nil {
					addressParts := []string{}
					if strings.TrimSpace(addr) != "" {
						addressParts = append(addressParts, strings.TrimSpace(addr))
					}
					if strings.TrimSpace(city) != "" || strings.TrimSpace(state) != "" || strings.TrimSpace(zipCode) != "" {
						cityStateZip := []string{}
						if strings.TrimSpace(city) != "" {
							cityStateZip = append(cityStateZip, strings.TrimSpace(city))
						}
						if strings.TrimSpace(state) != "" {
							cityStateZip = append(cityStateZip, strings.TrimSpace(state))
						}
						if strings.TrimSpace(zipCode) != "" {
							cityStateZip = append(cityStateZip, strings.TrimSpace(zipCode))
						}
						if len(cityStateZip) > 0 {
							addressParts = append(addressParts, strings.Join(cityStateZip, ", "))
						}
					}
					if len(addressParts) > 0 {
						coBorrowerData["currentAddress"] = strings.Join(addressParts, ", ")
					}
					// Check if co-borrower lives with primary borrower (no separate address)
					if len(addressParts) == 0 {
						coBorrowerData["liveTogether"] = true
					} else {
						coBorrowerData["liveTogether"] = false
					}
				} else {
					// No address found, assume they live together
					coBorrowerData["liveTogether"] = true
				}
				
				result["coBorrower"] = coBorrowerData
				log.Printf("GetApplication: Added co-borrower data to result for application %d", dealID)
			} else {
				log.Printf("GetApplication: No co-borrowers found for deal %d (checked borrower_progress table)", dealID)
			}
		}
	} else {
		log.Printf("GetApplication: No primary_borrower_id set for application %d", dealID)
	}

	log.Printf("GetApplication: Returning result for application %d, has borrower=%v, has coBorrower=%v", 
		dealID, result["borrower"] != nil, result["coBorrower"] != nil)
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
	MiddleName     string  `json:"middleName"`
	LastName       string  `json:"lastName" binding:"required"`
	Suffix         string  `json:"suffix"`
	Phone          string  `json:"phone" binding:"required"`
	PhoneType      string  `json:"phoneType"` // HOME, MOBILE, WORK, OTHER
	MaritalStatus  string  `json:"maritalStatus"`
	Password       string  `json:"password" binding:"required,min=8"`
	DateOfBirth    string  `json:"dateOfBirth"`
	Address        string  `json:"address"`
	City           string  `json:"city"`
	State          string  `json:"state"`
	ZipCode        string  `json:"zipCode"`
	LoanPurpose    string  `json:"loanPurpose" binding:"required"`
	VerificationCode string `json:"verificationCode"` // Optional - 2FA is disabled
	
	// Purchase-specific fields
	PurchasePrice  float64 `json:"purchasePrice"`
	DownPayment    float64 `json:"downPayment"`
	LoanAmount     float64 `json:"loanAmount"`
	
	// Refinance-specific fields
	PropertyAddress    string  `json:"propertyAddress"`
	OutstandingBalance float64 `json:"outstandingBalance"`
	
	// Legacy field for backward compatibility
	EstimatedPrice float64 `json:"estimatedPrice"`
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
// NOTE: 2FA is currently disabled - verification code is optional
func (s *URLAService) VerifyAndCreateBorrower(req VerifyAndCreateBorrowerRequest) (*VerifyAndCreateBorrowerResponse, error) {
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
	
	// Clear verification code (2FA is disabled, but clear if exists)
	// err = s.borrowerRepo.ClearVerificationCode(req.Email)
	// if err != nil {
	// 	// Log but don't fail
	// }
	
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
	err = s.UpdateCurrentFormStep(dealID, "borrower-info-2")
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

// UpdateCurrentFormStep updates the current form step for a deal
func (s *URLAService) UpdateCurrentFormStep(dealID int64, formStep string) error {
	return s.dealRepo.UpdateCurrentFormStep(dealID, formStep)
}

// SaveBorrowerData saves borrower information from the form
// nextFormStep is the form step to navigate to after saving (e.g., "borrower-info-2", "co-borrower-question")
func (s *URLAService) SaveBorrowerData(dealID int64, borrowerData map[string]interface{}, nextFormStep string) error {
	// Get the deal to find the borrower ID
	dealRow, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		return errors.New("deal not found")
	}

	// Scan the deal row to get primary_borrower_id
	var deal struct {
		ID                      int64
		LoanNumber              sql.NullString
		UniversalLoanIdentifier sql.NullString
		AgencyCaseIdentifier    sql.NullString
		ApplicationType         sql.NullString
		TotalBorrowers           sql.NullInt64
		ApplicationDate        sql.NullTime
		CreatedAt              sql.NullTime
		PrimaryBorrowerID      sql.NullInt64
		CurrentFormStep        sql.NullString
		LoanID                 sql.NullInt64
		LoanPurposeType        sql.NullString
		LoanAmountRequested    sql.NullFloat64
		LoanTermMonths         sql.NullInt64
		InterestRatePercentage sql.NullFloat64
		PropertyType           sql.NullString
		ManufacturedHomeWidth  sql.NullString
		TitleMannerType        sql.NullString
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

	borrowerID := deal.PrimaryBorrowerID.Int64

	// Update borrower information
	var firstName, lastName *string
	var middleName, suffix, ssn, maritalStatus, citizenshipStatus, email *string
	var dateOfBirth *time.Time
	var dependentsCount *int64
	var phone, phoneType *string

	if val, ok := borrowerData["firstName"].(string); ok && val != "" {
		firstName = &val
	}
	if val, ok := borrowerData["lastName"].(string); ok && val != "" {
		lastName = &val
	}
	if val, ok := borrowerData["middleName"].(string); ok && val != "" {
		middleName = &val
	}
	if val, ok := borrowerData["suffix"].(string); ok && val != "" {
		suffix = &val
	}
	if val, ok := borrowerData["email"].(string); ok && val != "" {
		email = &val
	}
	if val, ok := borrowerData["ssn"].(string); ok && val != "" {
		ssn = &val
	}
	if val, ok := borrowerData["maritalStatus"].(string); ok && val != "" {
		// Normalize marital status to match database constraint (capitalized: "Married", "Separated", "Unmarried")
		normalized := normalizeMaritalStatus(val)
		maritalStatus = &normalized
	}
	if val, ok := borrowerData["citizenshipStatus"].(string); ok && val != "" {
		citizenshipStatus = &val
	}
	if val, ok := borrowerData["dateOfBirth"].(string); ok && val != "" {
		if dob, err := time.Parse("2006-01-02", val); err == nil {
			dateOfBirth = &dob
		}
	}
	if val, ok := borrowerData["dependentsCount"].(float64); ok {
		count := int64(val)
		dependentsCount = &count
	}
	if val, ok := borrowerData["phone"].(string); ok && val != "" {
		phone = &val
		// Default to MOBILE if phoneType not specified
		if val, ok := borrowerData["phoneType"].(string); ok && val != "" {
			phoneType = &val
		} else {
			defaultType := "MOBILE"
			phoneType = &defaultType
		}
	}

	// Update email if provided
	if email != nil {
		err = s.borrowerRepo.UpdateEmail(borrowerID, *email)
		if err != nil {
			return errors.New("failed to update email: " + err.Error())
		}
	}

	// Update borrower details (middleName, suffix, maritalStatus, phone) if any are provided
	// Note: maritalStatus can be updated alone, so we check for it separately
	if maritalStatus != nil || middleName != nil || suffix != nil || phone != nil {
		err = s.borrowerRepo.UpdateBorrowerDetails(borrowerID, middleName, suffix, maritalStatus, phone, phoneType)
		if err != nil {
			return err
		}
	}

	// Update first/last name separately if needed
	if firstName != nil || lastName != nil {
		// Get current borrower to preserve existing values
		borrower, err := s.borrowerRepo.GetByID(borrowerID)
		if err == nil {
			first := borrower.FirstName
			last := borrower.LastName
			if firstName != nil {
				first = *firstName
			}
			if lastName != nil {
				last = *lastName
			}
			err = s.borrowerRepo.UpdateName(borrowerID, first, last)
			if err != nil {
				return err
			}
		}
	}

	// Update date of birth
	if dateOfBirth != nil {
		err = s.borrowerRepo.UpdateBorrowerInfo(borrowerID, dateOfBirth)
		if err != nil {
			return err
		}
	}

	// Update SSN (taxpayer identifier)
	if ssn != nil {
		// Update taxpayer identifier - this would need a new repository method
		// For now, we'll skip this as it requires additional implementation
	}

	// Update dependents count
	if dependentsCount != nil {
		// This would need a repository method to update dependent_count
		// For now, we'll skip this
	}

	// Update citizenship status
	if citizenshipStatus != nil {
		// This would need a repository method to update citizenship_residency_type
		// For now, we'll skip this
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
		err = s.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveBorrowerData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}

// SaveCoBorrowerData saves co-borrower information and links them to the deal
// nextFormStep is the form step to navigate to after saving (e.g., "getting-to-know-you-intro")
func (s *URLAService) SaveCoBorrowerData(dealID int64, coBorrowerData map[string]interface{}, nextFormStep string) error {
	// Extract co-borrower information
	var firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus string
	var isVeteran bool
	var liveTogether bool = true
	var address, city, state, zipCode string

	if val, ok := coBorrowerData["firstName"].(string); ok && val != "" {
		firstName = val
	} else {
		return errors.New("co-borrower first name is required")
	}

	if val, ok := coBorrowerData["lastName"].(string); ok && val != "" {
		lastName = val
	} else {
		return errors.New("co-borrower last name is required")
	}

	if val, ok := coBorrowerData["middleName"].(string); ok {
		middleName = val
	}
	if val, ok := coBorrowerData["suffix"].(string); ok {
		suffix = val
	}
	if val, ok := coBorrowerData["email"].(string); ok {
		email = val
	}
	if val, ok := coBorrowerData["phone"].(string); ok && val != "" {
		phone = val
	} else {
		return errors.New("co-borrower phone is required")
	}
	if val, ok := coBorrowerData["phoneType"].(string); ok && val != "" {
		phoneType = val
	} else {
		return errors.New("co-borrower phone type is required")
	}
	if val, ok := coBorrowerData["maritalStatus"].(string); ok && val != "" {
		// Normalize marital status to match database constraint (capitalized: "Married", "Separated", "Unmarried")
		maritalStatus = normalizeMaritalStatus(val)
	} else {
		return errors.New("co-borrower marital status is required")
	}
	if val, ok := coBorrowerData["isVeteran"].(bool); ok {
		isVeteran = val
	}
	if val, ok := coBorrowerData["liveTogether"].(bool); ok {
		liveTogether = val
	}

	// Get address if not living together
	if !liveTogether {
		if addr, ok := coBorrowerData["address"].(string); ok && addr != "" {
			address = addr
			if c, ok := coBorrowerData["city"].(string); ok {
				city = c
			}
			if s, ok := coBorrowerData["state"].(string); ok {
				state = s
			}
			if z, ok := coBorrowerData["zipCode"].(string); ok {
				zipCode = z
			}
		} else {
			return errors.New("co-borrower address is required when not living together")
		}
	}

	// Create co-borrower record
	coBorrowerID, err := s.borrowerRepo.CreateCoBorrower(firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus, isVeteran)
	if err != nil {
		return errors.New("failed to create co-borrower: " + err.Error())
	}

	// Link co-borrower to deal via borrower_progress table
	err = s.borrowerRepo.LinkBorrowerToDeal(coBorrowerID, dealID)
	if err != nil {
		return errors.New("failed to link co-borrower to deal: " + err.Error())
	}

	// Save address if not living together
	if !liveTogether && address != "" && city != "" && state != "" && zipCode != "" {
		err = s.borrowerRepo.UpdateOrCreateResidence(coBorrowerID, "BorrowerCurrentResidence", address, city, state, zipCode)
		if err != nil {
			return errors.New("failed to save co-borrower address: " + err.Error())
		}
	}

	// Update deal to joint application
	err = s.dealRepo.UpdateToJointApplication(dealID)
	if err != nil {
		return errors.New("failed to update deal to joint application: " + err.Error())
	}

	// Update current form step if provided
	if nextFormStep != "" {
		err = s.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveCoBorrowerData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}

// SaveLoanData saves loan information for an application
func (s *URLAService) SaveLoanData(dealID int64, loanData map[string]interface{}, nextFormStep string) error {
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
		err = s.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveLoanData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}

// parseFloatFromString parses a string that may contain currency formatting (commas, dollar signs)
func parseFloatFromString(s string) (float64, error) {
	// Remove currency formatting
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "$", "")
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, errors.New("empty string")
	}
	// Parse as float64
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}
