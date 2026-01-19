package services

import (
	"database/sql"
	"errors"
	"log"
	"taulen/backend/internal/config"
	"taulen/backend/internal/repositories"
)

// CoBorrowerService handles co-borrower-related operations
type CoBorrowerService struct {
	dealRepo     *repositories.DealRepository
	borrowerRepo *repositories.BorrowerRepository
	appService   *ApplicationService
}

// NewCoBorrowerService creates a new co-borrower service
func NewCoBorrowerService(cfg *config.Config) *CoBorrowerService {
	return &CoBorrowerService{
		dealRepo:     repositories.NewDealRepository(),
		borrowerRepo: repositories.NewBorrowerRepository(),
		appService:   NewApplicationService(),
	}
}

// SaveCoBorrowerData saves co-borrower information and links them to the deal
// nextFormStep is the form step to navigate to after saving (e.g., "getting-to-know-you-intro")
func (s *CoBorrowerService) SaveCoBorrowerData(dealID string, coBorrowerData map[string]interface{}, nextFormStep string) error {
	// First, check if a co-borrower already exists for this deal
	// Get the deal to find the primary borrower ID
	dealRow, err := s.dealRepo.GetDealByID(dealID)
	if err != nil {
		return errors.New("deal not found")
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

	var coBorrowerID string
	var existingCoBorrower *repositories.Borrower

	// Check if co-borrower already exists
	if deal.PrimaryBorrowerID.Valid {
		coBorrowers, err := s.borrowerRepo.GetCoBorrowersByDealID(dealID, deal.PrimaryBorrowerID.String)
		if err == nil && len(coBorrowers) > 0 {
			existingCoBorrower = coBorrowers[0]
			coBorrowerID = existingCoBorrower.ID
		}
	}

	// Extract co-borrower information
	var firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus string
	var isVeteran bool
	var liveTogether bool = true
	var address, city, state, zipCode string

	log.Printf("SaveCoBorrowerData: Starting for dealID=%s, existingCoBorrower=%v", dealID, existingCoBorrower != nil)

	if val, ok := coBorrowerData["firstName"].(string); ok && val != "" {
		firstName = val
	} else if existingCoBorrower == nil {
		return errors.New("co-borrower first name is required")
	} else {
		firstName = existingCoBorrower.FirstName
	}

	if val, ok := coBorrowerData["lastName"].(string); ok && val != "" {
		lastName = val
	} else if existingCoBorrower == nil {
		return errors.New("co-borrower last name is required")
	} else {
		lastName = existingCoBorrower.LastName
	}

	if val, ok := coBorrowerData["middleName"].(string); ok {
		middleName = val
	} else if existingCoBorrower != nil && existingCoBorrower.MiddleName.Valid {
		middleName = existingCoBorrower.MiddleName.String
	}
	if val, ok := coBorrowerData["suffix"].(string); ok {
		suffix = val
	} else if existingCoBorrower != nil && existingCoBorrower.Suffix.Valid {
		suffix = existingCoBorrower.Suffix.String
	}
	if val, ok := coBorrowerData["email"].(string); ok {
		email = val
	} else if existingCoBorrower != nil && existingCoBorrower.EmailAddress.Valid {
		email = existingCoBorrower.EmailAddress.String
	}
	if val, ok := coBorrowerData["phone"].(string); ok && val != "" {
		phone = val
	} else if existingCoBorrower == nil {
		return errors.New("co-borrower phone is required")
	} else {
		// Get phone from existing co-borrower
		if existingCoBorrower.MobilePhone.Valid && existingCoBorrower.MobilePhone.String != "" {
			phone = existingCoBorrower.MobilePhone.String
		} else if existingCoBorrower.HomePhone.Valid && existingCoBorrower.HomePhone.String != "" {
			phone = existingCoBorrower.HomePhone.String
		} else if existingCoBorrower.WorkPhone.Valid && existingCoBorrower.WorkPhone.String != "" {
			phone = existingCoBorrower.WorkPhone.String
		}
	}
	// phoneType is optional - can be NULL in database
	// It's not part of co-borrower-info-1 form, so it may not be provided
	if val, ok := coBorrowerData["phoneType"].(string); ok && val != "" {
		phoneType = val
	} else if existingCoBorrower != nil {
		// For existing co-borrower, try to infer phoneType from existing phone fields
		if existingCoBorrower.MobilePhone.Valid && existingCoBorrower.MobilePhone.String != "" {
			phoneType = "MOBILE"
		} else if existingCoBorrower.HomePhone.Valid && existingCoBorrower.HomePhone.String != "" {
			phoneType = "HOME"
		} else if existingCoBorrower.WorkPhone.Valid && existingCoBorrower.WorkPhone.String != "" {
			phoneType = "WORK"
		}
		// If no phoneType can be inferred, leave it empty (will be NULL in database)
	}
	// For new co-borrower without phoneType, leave it empty (NULL) - this is allowed
	if val, ok := coBorrowerData["maritalStatus"].(string); ok && val != "" {
		// Normalize marital status to match database constraint (capitalized: "Married", "Separated", "Unmarried")
		maritalStatus = normalizeMaritalStatus(val)
		log.Printf("SaveCoBorrowerData: Marital status provided: '%s'", maritalStatus)
	} else if existingCoBorrower == nil {
		// For new co-borrower (co-borrower-info-1), marital status is optional
		// It will be set in co-borrower-info-2
		maritalStatus = "" // Leave empty - will be NULL in database, same as borrower-info-1
		log.Printf("SaveCoBorrowerData: No marital status provided for new co-borrower, will be NULL (same as borrower-info-1)")
	} else if existingCoBorrower.MaritalStatus.Valid {
		maritalStatus = existingCoBorrower.MaritalStatus.String
		log.Printf("SaveCoBorrowerData: Using existing marital status: '%s'", maritalStatus)
	} else {
		// Existing co-borrower but no marital status - leave empty
		maritalStatus = ""
		log.Printf("SaveCoBorrowerData: Existing co-borrower has no marital status, leaving empty")
	}
	if val, ok := coBorrowerData["isVeteran"].(bool); ok {
		isVeteran = val
	} else if existingCoBorrower != nil && existingCoBorrower.MilitaryServiceStatus.Valid {
		isVeteran = existingCoBorrower.MilitaryServiceStatus.Bool
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
		} else if !liveTogether {
			return errors.New("co-borrower address is required when not living together")
		}
	}

	if existingCoBorrower != nil {
		// Update existing co-borrower
		coBorrowerID = existingCoBorrower.ID

		// Update basic info if provided
		if middleName != "" || suffix != "" || email != "" || phone != "" || phoneType != "" {
			var middleNamePtr, suffixPtr, emailPtr *string
			var phonePtr, phoneTypePtr *string

			if middleName != "" {
				middleNamePtr = &middleName
			}
			if suffix != "" {
				suffixPtr = &suffix
			}
			if email != "" {
				emailPtr = &email
			}
			if phone != "" {
				phonePtr = &phone
			}
			if phoneType != "" {
				phoneTypePtr = &phoneType
			}

			err = s.borrowerRepo.UpdateBorrowerDetails(coBorrowerID, middleNamePtr, suffixPtr, nil, phonePtr, phoneTypePtr)
			if err != nil {
				return errors.New("failed to update co-borrower details: " + err.Error())
			}

			if emailPtr != nil {
				err = s.borrowerRepo.UpdateEmail(coBorrowerID, email)
				if err != nil {
					return errors.New("failed to update co-borrower email: " + err.Error())
				}
			}
		}

		// Update marital status and military status if provided
		if maritalStatus != "" {
			var maritalStatusPtr *string
			maritalStatusPtr = &maritalStatus
			err = s.borrowerRepo.UpdateBorrowerDetails(coBorrowerID, nil, nil, maritalStatusPtr, nil, nil)
			if err != nil {
				return errors.New("failed to update co-borrower marital status: " + err.Error())
			}
		}

		// Update military status and consents
		err = s.borrowerRepo.UpdateBorrowerConsentsAndMilitary(coBorrowerID, &isVeteran, nil, nil)
		if err != nil {
			return errors.New("failed to update co-borrower military status: " + err.Error())
		}
	} else {
		// Create new co-borrower record
		// Marital status can be empty (will be NULL in database) - same behavior as borrower-info-1
		// It will be set in co-borrower-info-2
		log.Printf("SaveCoBorrowerData: Creating new co-borrower - firstName='%s', lastName='%s', email='%s', phone='%s', phoneType='%s', maritalStatus='%s' (empty means NULL), isVeteran=%v",
			firstName, lastName, email, phone, phoneType, maritalStatus, isVeteran)

		coBorrowerID, err = s.borrowerRepo.CreateCoBorrower(firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus, isVeteran)
		if err != nil {
			log.Printf("SaveCoBorrowerData: Error creating co-borrower: %v", err)
			log.Printf("SaveCoBorrowerData: Error details - firstName='%s', lastName='%s', email='%s', phone='%s', phoneType='%s', maritalStatus='%s' (empty=%v), isVeteran=%v", 
				firstName, lastName, email, phone, phoneType, maritalStatus, maritalStatus == "", isVeteran)
			return errors.New("failed to create co-borrower: " + err.Error())
		}

		log.Printf("SaveCoBorrowerData: Successfully created co-borrower with ID=%s", coBorrowerID)

		// Link co-borrower to deal via borrower_progress table
		err = s.borrowerRepo.LinkBorrowerToDeal(coBorrowerID, dealID)
		if err != nil {
			return errors.New("failed to link co-borrower to deal: " + err.Error())
		}
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
		err = s.appService.UpdateCurrentFormStep(dealID, nextFormStep)
		if err != nil {
			log.Printf("SaveCoBorrowerData: Failed to update current form step: %v", err)
			// Don't fail the entire operation if step update fails
		}
	}

	return nil
}
