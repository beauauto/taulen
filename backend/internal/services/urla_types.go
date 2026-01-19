package services

// Common types shared across URLA services

// CreateApplicationRequest represents a request to create a new application
type CreateApplicationRequest struct {
	LoanType    string  `json:"loanType" binding:"required"`
	LoanPurpose string  `json:"loanPurpose" binding:"required"`
	LoanAmount  float64 `json:"loanAmount" binding:"required,gt=0"`
}

// ApplicationResponse represents an application in API responses
type ApplicationResponse struct {
	ID                  string   `json:"id"`
	LoanType            string   `json:"loanType"`
	LoanPurpose         string   `json:"loanPurpose"`
	LoanAmount          float64  `json:"loanAmount"`
	Status              string   `json:"status"`
	CreatedDate         string   `json:"createdDate"`
	LastUpdatedDate     string   `json:"lastUpdatedDate"`
	ProgressPercentage  *int     `json:"progressPercentage,omitempty"`
	LastUpdatedSection  *string  `json:"lastUpdatedSection,omitempty"`
}

// VerifyAndCreateBorrowerResponse represents the response after verification and account creation
type VerifyAndCreateBorrowerResponse struct {
	Application        ApplicationResponse        `json:"application"`
	AccessToken        string                     `json:"accessToken"`
	RefreshToken       string                     `json:"refreshToken"`
	User               AuthUserResponse            `json:"user"`
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
