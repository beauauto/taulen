package services

import (
	"database/sql"
	"errors"
	"taulen/backend/internal/repositories"
)

// URLAService handles URLA application business logic
// In the new schema, a mortgage application is called a "deal"
type URLAService struct {
	dealRepo         *repositories.DealRepository
	dealProgressRepo *repositories.DealProgressRepository
	userRepo         *repositories.UserRepository
	borrowerRepo     *repositories.BorrowerRepository
}

// NewURLAService creates a new URLA service
func NewURLAService() *URLAService {
	return &URLAService{
		dealRepo:         repositories.NewDealRepository(),
		dealProgressRepo: repositories.NewDealProgressRepository(),
		userRepo:         repositories.NewUserRepository(),
		borrowerRepo:     repositories.NewBorrowerRepository(),
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
	ID              int64   `json:"id"`
	LoanType        string  `json:"loanType"`
	LoanPurpose     string  `json:"loanPurpose"`
	LoanAmount      float64 `json:"loanAmount"`
	Status          string  `json:"status"`
	CreatedDate     string  `json:"createdDate"`
	LastUpdatedDate string  `json:"lastUpdatedDate"`
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
	dealID, err := s.dealRepo.CreateDeal(userID, nil, req.LoanPurpose, req.LoanAmount)
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
	dealID, err := s.dealRepo.CreateDeal("", &borrowerID, req.LoanPurpose, req.LoanAmount)
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
