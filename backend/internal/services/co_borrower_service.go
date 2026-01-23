package services

import (
	"database/sql"
	"errors"
	"log"
	"strings"
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

	// PRIORITY 1: Always check if co-borrower already exists for this deal first
	// This is the primary way to find the co-borrower created in co-borrower-info-1
	// co-borrower-info-2 should use the co-borrower ID from the deal, not search by email/phone
	if deal.PrimaryBorrowerID.Valid {
		coBorrowers, err := s.borrowerRepo.GetCoBorrowersByDealID(dealID, deal.PrimaryBorrowerID.String)
		if err == nil && len(coBorrowers) > 0 {
			existingCoBorrower = coBorrowers[0]
			coBorrowerID = existingCoBorrower.ID
			log.Printf("SaveCoBorrowerData: Found existing co-borrower for deal: ID=%s (from borrower_progress)", coBorrowerID)
		} else if err != nil {
			log.Printf("SaveCoBorrowerData: Error checking for existing co-borrower for deal: %v", err)
		}
	}

	// PRIORITY 2: Only if not found by deal, check by email/phone (for co-borrower-info-1 case)
	// This handles the case where co-borrower-info-1 is creating a new co-borrower
	if existingCoBorrower == nil {
		var emailForLookup, phoneForLookup string
		if val, ok := coBorrowerData["email"].(string); ok && val != "" {
			emailForLookup = val
		}
		if val, ok := coBorrowerData["phone"].(string); ok && val != "" {
			// Normalize phone number by removing formatting for lookup
			// This handles cases where phone is formatted as (123) 456-7890 but stored as 1234567890
			phoneForLookup = strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(val, "(", ""), ")", ""), "-", "")
			phoneForLookup = strings.ReplaceAll(phoneForLookup, " ", "")
		}

		// Check if a borrower with this email OR phone already exists globally
		// This ensures uniqueness by email/phone across all borrowers
		if emailForLookup != "" || phoneForLookup != "" {
			existingBorrowerByEmailOrPhone, err := s.borrowerRepo.GetByEmailOrPhone(emailForLookup, phoneForLookup)
			if err == nil && existingBorrowerByEmailOrPhone != nil {
				existingCoBorrower = existingBorrowerByEmailOrPhone
				coBorrowerID = existingCoBorrower.ID
				log.Printf("SaveCoBorrowerData: Found existing borrower by email/phone: ID=%s, email=%s, phone=%s", 
					coBorrowerID, emailForLookup, phoneForLookup)
			} else if err != nil && err != sql.ErrNoRows {
				log.Printf("SaveCoBorrowerData: Error checking for existing borrower by email/phone: %v", err)
			}
		}
	}

	// Extract co-borrower information
	// Note: firstName, lastName, email, phone, phoneType, middleName, suffix belong to co-borrower-info-1
	// They should NOT be extracted or updated in co-borrower-info-2
	// Only extract them if we're creating a NEW co-borrower (co-borrower-info-1 case)
	var firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus string
	var isVeteran bool
	var address, city, state, zipCode string

	log.Printf("SaveCoBorrowerData: Starting for dealID=%s, existingCoBorrower=%v", dealID, existingCoBorrower != nil)

	// Only extract firstName, lastName, email, phone if we're creating a NEW co-borrower (co-borrower-info-1)
	// In co-borrower-info-2, these fields should NOT be present in the payload
	if existingCoBorrower == nil {
		// Creating new co-borrower - extract all required fields
		if val, ok := coBorrowerData["firstName"].(string); ok && val != "" {
			firstName = val
		}
		if val, ok := coBorrowerData["lastName"].(string); ok && val != "" {
			lastName = val
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
		}
		if val, ok := coBorrowerData["phoneType"].(string); ok && val != "" {
			phoneType = val
		}
	} else {
		// Updating existing co-borrower (co-borrower-info-2) - get these from existing record
		// Do NOT extract or update firstName, lastName, email, phone, phoneType, middleName, suffix
		// These belong to co-borrower-info-1 and should not be changed in co-borrower-info-2
		firstName = existingCoBorrower.FirstName
		lastName = existingCoBorrower.LastName
		if existingCoBorrower.MiddleName.Valid {
			middleName = existingCoBorrower.MiddleName.String
		}
		if existingCoBorrower.Suffix.Valid {
			suffix = existingCoBorrower.Suffix.String
		}
		if existingCoBorrower.EmailAddress.Valid {
			email = existingCoBorrower.EmailAddress.String
		}
		// Get phone from existing co-borrower
		if existingCoBorrower.MobilePhone.Valid && existingCoBorrower.MobilePhone.String != "" {
			phone = existingCoBorrower.MobilePhone.String
			phoneType = "MOBILE"
		} else if existingCoBorrower.HomePhone.Valid && existingCoBorrower.HomePhone.String != "" {
			phone = existingCoBorrower.HomePhone.String
			phoneType = "HOME"
		} else if existingCoBorrower.WorkPhone.Valid && existingCoBorrower.WorkPhone.String != "" {
			phone = existingCoBorrower.WorkPhone.String
			phoneType = "WORK"
		}
	}
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

	// Get address (optional for co-borrower-info-1, required for co-borrower-info-2)
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
	}
	// Only require address when updating an existing co-borrower (co-borrower-info-2)
	// For new co-borrowers (co-borrower-info-1), address is optional and will be set in co-borrower-info-2
	if existingCoBorrower != nil {
		// Updating existing co-borrower - address should be provided
		if address == "" || city == "" || state == "" || zipCode == "" {
			return errors.New("co-borrower address is required (street, city, state, and zip code)")
		}
	}
	// For new co-borrower (co-borrower-info-1), address is optional - no validation needed

	if existingCoBorrower != nil {
		// Update existing co-borrower (co-borrower-info-2 case)
		// Do NOT update firstName, lastName, email, phone, phoneType, middleName, suffix
		// These belong to co-borrower-info-1 and should not be changed here
		coBorrowerID = existingCoBorrower.ID

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

		// Note: borrower_progress will be ensured in the final ensure step below
		// This ensures it's always created even if this branch is skipped
		log.Printf("SaveCoBorrowerData: Existing borrower ID=%s will be linked in final ensure step", coBorrowerID)
	} else {
		// Create new co-borrower record
		// This should only happen in co-borrower-info-1, not co-borrower-info-2
		// In co-borrower-info-2, the co-borrower should already exist
		// But we handle it here as a fallback
		
		// Validate required fields for new co-borrower
		if firstName == "" {
			return errors.New("co-borrower first name is required when creating a new co-borrower")
		}
		if lastName == "" {
			return errors.New("co-borrower last name is required when creating a new co-borrower")
		}
		if phone == "" {
			return errors.New("co-borrower phone is required when creating a new co-borrower")
		}
		
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
	}

	// CRITICAL: Always ensure borrower_progress entry exists for this co-borrower and deal
	// This MUST happen before any other operations that might fail and return early
	// This is essential for the co-borrower to be found by GetApplication
	// This handles edge cases where the borrower exists but borrower_progress wasn't created
	if coBorrowerID == "" {
		return errors.New("co-borrower ID is empty - cannot link to deal")
	}
	err = s.borrowerRepo.LinkBorrowerToDeal(coBorrowerID, dealID)
	if err != nil {
		log.Printf("SaveCoBorrowerData: CRITICAL ERROR - Failed to ensure borrower_progress entry exists for borrower %s and deal %s: %v", coBorrowerID, dealID, err)
		// This is critical - return error to ensure borrower_progress is created
		return errors.New("failed to link co-borrower to deal: " + err.Error())
	}
	log.Printf("SaveCoBorrowerData: Ensured borrower_progress entry exists for borrower %s and deal %s", coBorrowerID, dealID)

	// Save address if provided (optional for co-borrower-info-1, required for co-borrower-info-2)
	if address != "" && city != "" && state != "" && zipCode != "" {
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
