package services

import (
	"taulen/backend/internal/config"
)

// URLAService handles URLA application business logic
// In the new schema, a mortgage application is called a "deal"
// This service acts as a facade, delegating to specialized services
type URLAService struct {
	appService         *ApplicationService
	borrowerService    *BorrowerService
	coBorrowerService  *CoBorrowerService
	loanService        *LoanService
	progressService    *ProgressService
	verificationService *VerificationService
}

// NewURLAService creates a new URLA service
func NewURLAService(cfg *config.Config) *URLAService {
	return &URLAService{
		appService:         NewApplicationService(),
		borrowerService:    NewBorrowerService(cfg),
		coBorrowerService:  NewCoBorrowerService(cfg),
		loanService:        NewLoanService(cfg),
		progressService:    NewProgressService(),
		verificationService: NewVerificationService(cfg),
	}
}

// Application/Deal management methods - delegate to ApplicationService

// CreateApplication creates a new URLA application
func (s *URLAService) CreateApplication(userID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
	return s.appService.CreateApplication(userID, req)
}

// GetApplication retrieves a deal (application) by ID
func (s *URLAService) GetApplication(dealID string) (map[string]interface{}, error) {
	return s.appService.GetApplication(dealID)
}

// UpdateApplicationStatus updates the status of an application
func (s *URLAService) UpdateApplicationStatus(applicationID string, status string) error {
	return s.appService.UpdateApplicationStatus(applicationID, status)
}

// GetApplicationsByEmployee retrieves all applications managed by an employee
func (s *URLAService) GetApplicationsByEmployee(userID string) ([]ApplicationResponse, error) {
	return s.appService.GetApplicationsByEmployee(userID)
}

// GetApplicationsByBorrower retrieves all applications for a borrower
func (s *URLAService) GetApplicationsByBorrower(borrowerID string) ([]ApplicationResponse, error) {
	return s.appService.GetApplicationsByBorrower(borrowerID)
}

// CreateApplicationForBorrower creates a new application for a borrower
func (s *URLAService) CreateApplicationForBorrower(borrowerID string, req CreateApplicationRequest) (*ApplicationResponse, error) {
	return s.appService.CreateApplicationForBorrower(borrowerID, req)
}

// UpdateCurrentFormStep updates the current form step for a deal
func (s *URLAService) UpdateCurrentFormStep(dealID string, formStep string) error {
	return s.appService.UpdateCurrentFormStep(dealID, formStep)
}

// Borrower management methods - delegate to BorrowerService

// VerifyAndCreateBorrower verifies the code and creates borrower account with deal
func (s *URLAService) VerifyAndCreateBorrower(req VerifyAndCreateBorrowerRequest) (*VerifyAndCreateBorrowerResponse, error) {
	return s.borrowerService.VerifyAndCreateBorrower(req)
}

// SaveBorrowerData saves borrower information from the form
func (s *URLAService) SaveBorrowerData(dealID string, borrowerData map[string]interface{}, nextFormStep string) error {
	return s.borrowerService.SaveBorrowerData(dealID, borrowerData, nextFormStep)
}

// Co-borrower management methods - delegate to CoBorrowerService

// SaveCoBorrowerData saves co-borrower information and links them to the deal
func (s *URLAService) SaveCoBorrowerData(dealID string, coBorrowerData map[string]interface{}, nextFormStep string) error {
	return s.coBorrowerService.SaveCoBorrowerData(dealID, coBorrowerData, nextFormStep)
}

// Loan management methods - delegate to LoanService

// SaveLoanData saves loan information for an application
func (s *URLAService) SaveLoanData(dealID string, loanData map[string]interface{}, nextFormStep string) error {
	return s.loanService.SaveLoanData(dealID, loanData, nextFormStep)
}

// Progress tracking methods - delegate to ProgressService

// GetDealProgress retrieves progress for a deal
func (s *URLAService) GetDealProgress(dealID string) (map[string]interface{}, error) {
	return s.progressService.GetDealProgress(dealID)
}

// UpdateDealProgressSection updates a specific section's completion status
func (s *URLAService) UpdateDealProgressSection(dealID string, section string, complete bool) error {
	return s.progressService.UpdateDealProgressSection(dealID, section, complete)
}

// UpdateDealProgressNotes updates progress notes
func (s *URLAService) UpdateDealProgressNotes(dealID string, notes string) error {
	return s.progressService.UpdateDealProgressNotes(dealID, notes)
}

// Verification methods - delegate to VerificationService

// SendVerificationCode sends a verification code via email or SMS
func (s *URLAService) SendVerificationCode(req SendVerificationCodeRequest) error {
	return s.verificationService.SendVerificationCode(req)
}
