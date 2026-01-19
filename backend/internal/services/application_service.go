package services

import (
	"database/sql"
	"errors"
	"log"
	"strings"
	"taulen/backend/internal/repositories"
)

// ApplicationService handles application/deal CRUD operations
type ApplicationService struct {
	dealRepo     *repositories.DealRepository
	userRepo     *repositories.UserRepository
	borrowerRepo *repositories.BorrowerRepository
}

// NewApplicationService creates a new application service
func NewApplicationService() *ApplicationService {
	return &ApplicationService{
		dealRepo:     repositories.NewDealRepository(),
		userRepo:     repositories.NewUserRepository(),
		borrowerRepo: repositories.NewBorrowerRepository(),
	}
}

// CreateApplication creates a new URLA application
// userID is the employee (User) managing this application
// applicantID can be nil initially, set later when primary applicant is created
func (s *ApplicationService) CreateApplication(userID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
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
func (s *ApplicationService) GetApplication(dealID string) (map[string]interface{}, error) {
	log.Printf("GetApplication: Fetching application %s", dealID)
	row, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		log.Printf("GetApplication: Error fetching deal %s: %v", dealID, err)
		return nil, errors.New("deal not found")
	}

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

	err = row.Scan(
		&deal.ID, &deal.LoanNumber, &deal.UniversalLoanIdentifier, &deal.AgencyCaseIdentifier,
		&deal.ApplicationType, &deal.TotalBorrowers, &deal.ApplicationDate, &deal.CreatedAt, &deal.PrimaryBorrowerID,
		&deal.CurrentFormStep,
		&deal.LoanID, &deal.LoanPurposeType, &deal.LoanAmountRequested, &deal.LoanTermMonths,
		&deal.InterestRatePercentage, &deal.PropertyType, &deal.ManufacturedHomeWidth, &deal.TitleMannerType,
	)
	if err != nil {
		log.Printf("GetApplication: Error scanning deal %s: %v", dealID, err)
		return nil, errors.New("failed to retrieve deal")
	}

	primaryBorrowerIDValue := ""
	if deal.PrimaryBorrowerID.Valid {
		primaryBorrowerIDValue = deal.PrimaryBorrowerID.String
	}
	log.Printf("GetApplication: Deal %s - PrimaryBorrowerID.Valid=%v, PrimaryBorrowerID.String=%s",
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
		log.Printf("GetApplication: Fetching borrower data for borrower ID %s", deal.PrimaryBorrowerID.String)
		borrower, err := s.borrowerRepo.GetByID(deal.PrimaryBorrowerID.String)
		if err != nil {
			log.Printf("GetApplication: Error fetching borrower %s: %v", deal.PrimaryBorrowerID.String, err)
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
			addr, city, state, zipCode, err := s.borrowerRepo.GetCurrentResidence(deal.PrimaryBorrowerID.String)
			if err != nil {
				log.Printf("Error fetching residence for borrower %s: %v", deal.PrimaryBorrowerID.String, err)
			} else {
				log.Printf("Residence data for borrower %s: addr=%s, city=%s, state=%s, zip=%s",
					deal.PrimaryBorrowerID.String, addr, city, state, zipCode)
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
					log.Printf("Synthesized currentAddress for borrower %s: %s", deal.PrimaryBorrowerID.String, fullAddress)
				} else {
					log.Printf("No address parts found for borrower %s (addr=%s, city=%s, state=%s, zip=%s)",
						deal.PrimaryBorrowerID.String, addr, city, state, zipCode)
				}
			}

			result["borrower"] = borrowerData
			log.Printf("GetApplication: Added borrower data to result for application %s", dealID)
		} else {
			log.Printf("GetApplication: Borrower not found or error for borrower ID %s", deal.PrimaryBorrowerID.String)
		}

		// Fetch co-borrower data - always try to fetch if primary borrower exists
		// This is more robust than checking TotalBorrowers which might be NULL
		log.Printf("GetApplication: Attempting to fetch co-borrower data for deal %s (total borrowers: %v)",
			dealID, deal.TotalBorrowers)
		coBorrowers, err := s.borrowerRepo.GetCoBorrowersByDealID(dealID, deal.PrimaryBorrowerID.String)
		if err != nil {
			log.Printf("GetApplication: Error fetching co-borrowers for deal %s: %v", dealID, err)
		} else {
			log.Printf("GetApplication: Found %d co-borrower(s) for deal %s", len(coBorrowers), dealID)
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
				log.Printf("GetApplication: Added co-borrower data to result for application %s", dealID)
			} else {
				log.Printf("GetApplication: No co-borrowers found for deal %s (checked borrower_progress table)", dealID)
			}
		}
	} else {
		log.Printf("GetApplication: No primary_borrower_id set for application %s", dealID)
	}

	log.Printf("GetApplication: Returning result for application %s, has borrower=%v, has coBorrower=%v",
		dealID, result["borrower"] != nil, result["coBorrower"] != nil)
	return result, nil
}

// UpdateApplicationStatus updates the status of an application
func (s *ApplicationService) UpdateApplicationStatus(applicationID string, status string) error {
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
func (s *ApplicationService) GetApplicationsByEmployee(userID string) ([]ApplicationResponse, error) {
	rows, err := s.dealRepo.GetDealsByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to retrieve applications")
	}
	defer rows.Close()

	var applications []ApplicationResponse
	for rows.Next() {
		var app struct {
			ID              string
			ApplicantID     sql.NullString
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
func (s *ApplicationService) GetApplicationsByBorrower(borrowerID string) ([]ApplicationResponse, error) {
	rows, err := s.dealRepo.GetDealsByBorrowerID(borrowerID)
	if err != nil {
		return nil, errors.New("failed to retrieve applications")
	}
	defer rows.Close()

	var applications []ApplicationResponse
	for rows.Next() {
		var app struct {
			ID                string
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
func (s *ApplicationService) CreateApplicationForBorrower(borrowerID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
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

// UpdateCurrentFormStep updates the current form step for a deal
func (s *ApplicationService) UpdateCurrentFormStep(dealID string, formStep string) error {
	return s.dealRepo.UpdateCurrentFormStep(dealID, formStep)
}
