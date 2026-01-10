package services

import (
	"database/sql"
	"errors"
	"taulen/backend/internal/repositories"
)

// URLAService handles URLA application business logic
type URLAService struct {
	urlaRepo *repositories.URLAApplicationRepository
	userRepo *repositories.UserRepository
}

// NewURLAService creates a new URLA service
func NewURLAService() *URLAService {
	return &URLAService{
		urlaRepo: repositories.NewURLAApplicationRepository(),
		userRepo: repositories.NewUserRepository(),
	}
}

// CreateApplicationRequest represents a request to create a new application
type CreateApplicationRequest struct {
	LoanType    string  `json:"loan_type" binding:"required"`
	LoanPurpose string  `json:"loan_purpose" binding:"required"`
	LoanAmount  float64 `json:"loan_amount" binding:"required,gt=0"`
}

// ApplicationResponse represents an application in API responses
type ApplicationResponse struct {
	ID              int64   `json:"id"`
	LoanType        string  `json:"loan_type"`
	LoanPurpose     string  `json:"loan_purpose"`
	LoanAmount      float64 `json:"loan_amount"`
	Status          string  `json:"status"`
	CreatedDate     string  `json:"created_date"`
	LastUpdatedDate string  `json:"last_updated_date"`
}

// CreateApplication creates a new URLA application
func (s *URLAService) CreateApplication(userID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
	// Verify user exists
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Create application
	appID, err := s.urlaRepo.CreateApplication(req.LoanType, req.LoanPurpose, req.LoanAmount)
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
		&app.ID, &app.ApplicationDate, &app.LoanType, &app.LoanPurpose,
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
		result["loan_type"] = app.LoanType.String
	}
	if app.LoanPurpose.Valid {
		result["loan_purpose"] = app.LoanPurpose.String
	}
	if app.LoanAmount.Valid {
		result["loan_amount"] = app.LoanAmount.Float64
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
