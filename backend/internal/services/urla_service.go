package services

import (
	"database/sql"
	"errors"
	"taulen/backend/internal/repositories"
)

// URLAService handles URLA application business logic
type URLAService struct {
	urlaRepo     *repositories.URLAApplicationRepository
	userRepo     *repositories.UserRepository
	borrowerRepo *repositories.BorrowerRepository
}

// NewURLAService creates a new URLA service
func NewURLAService() *URLAService {
	return &URLAService{
		urlaRepo:     repositories.NewURLAApplicationRepository(),
		userRepo:     repositories.NewUserRepository(),
		borrowerRepo: repositories.NewBorrowerRepository(),
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

	// Create application with UserID (employee) and NULL ApplicantID (set later)
	appID, err := s.urlaRepo.CreateApplication(userID, nil, req.LoanType, req.LoanPurpose, req.LoanAmount)
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	return &ApplicationResponse{
		ID:          appID,
		LoanType:    req.LoanType,
		LoanPurpose: req.LoanPurpose,
		LoanAmount:  req.LoanAmount,
		Status:      "draft",
	}, nil
}

// GetApplication retrieves an application by ID
func (s *URLAService) GetApplication(applicationID int64) (map[string]interface{}, error) {
	row, err := s.urlaRepo.GetApplicationByID(applicationID)
	if err != nil {
		return nil, errors.New("application not found")
	}

	var app struct {
		ID              int64
		ApplicantID     sql.NullInt64
		UserID          sql.NullString
		ApplicationDate sql.NullTime
		LoanType        sql.NullString
		LoanPurpose     sql.NullString
		PropertyType    sql.NullString
		PropertyUsage   sql.NullString
		LoanAmount      sql.NullFloat64
		DownPayment     sql.NullFloat64
		TermYears       sql.NullInt64
		InterestRate    sql.NullFloat64
		AmortizationType sql.NullString
		Status          sql.NullString
		CreatedDate     sql.NullTime
		LastUpdatedDate sql.NullTime
	}

	err = row.Scan(
		&app.ID, &app.ApplicantID, &app.UserID, &app.ApplicationDate, &app.LoanType, &app.LoanPurpose,
		&app.PropertyType, &app.PropertyUsage, &app.LoanAmount, &app.DownPayment,
		&app.TermYears, &app.InterestRate, &app.AmortizationType, &app.Status,
		&app.CreatedDate, &app.LastUpdatedDate,
	)
	if err != nil {
		return nil, errors.New("failed to retrieve application")
	}

	result := make(map[string]interface{})
	result["id"] = app.ID
	if app.LoanType.Valid {
		result["loanType"] = app.LoanType.String
	}
	if app.LoanPurpose.Valid {
		result["loanPurpose"] = app.LoanPurpose.String
	}
	if app.LoanAmount.Valid {
		result["loanAmount"] = app.LoanAmount.Float64
	}
	if app.Status.Valid {
		result["status"] = app.Status.String
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

	return s.urlaRepo.UpdateApplicationStatus(applicationID, status)
}

// GetApplicationsByEmployee retrieves all applications managed by an employee
func (s *URLAService) GetApplicationsByEmployee(userID string) ([]ApplicationResponse, error) {
	rows, err := s.urlaRepo.GetApplicationsByUserID(userID)
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
	rows, err := s.urlaRepo.GetApplicationsByBorrowerID(borrowerID)
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

	// Create application - UserID can be NULL if no employee assigned yet
	// Note: The new schema uses deal/loan instead of loan_application
	// For now, we'll pass borrowerID to maintain compatibility
	appID, err := s.urlaRepo.CreateApplication("", &borrowerID, req.LoanType, req.LoanPurpose, req.LoanAmount)
	if err != nil {
		return nil, errors.New("failed to create application")
	}

	// Update borrower's deal_id if it was NULL
	// This will be handled when the deal is created

	return &ApplicationResponse{
		ID:          appID,
		LoanType:    req.LoanType,
		LoanPurpose: req.LoanPurpose,
		LoanAmount:  req.LoanAmount,
		Status:      "draft",
	}, nil
}
