package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"taulen/backend/internal/middleware"
	"taulen/backend/internal/services"
)

// URLAHandler handles URLA application HTTP requests
type URLAHandler struct {
	urlaService *services.URLAService
}

// NewURLAHandler creates a new URLA handler
func NewURLAHandler(urlaService *services.URLAService) *URLAHandler {
	return &URLAHandler{
		urlaService: urlaService,
	}
}

// CreateApplication handles creating a new URLA application
// Can be called by employee or applicant
func (h *URLAHandler) CreateApplication(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req services.CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Both borrowers and employees now use UUID strings
	// Try to create application for borrower first (if userID is a borrower)
	// If that fails, try as employee
	response, err := h.urlaService.CreateApplicationForBorrower(userID, req)
	if err != nil {
		// If borrower creation fails, try as employee
		response, err = h.urlaService.CreateApplication(userID, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, response)
}

// GetApplication handles retrieving an application by ID
func (h *URLAHandler) GetApplication(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	application, err := h.urlaService.GetApplication(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application)
}

// UpdateApplicationStatus handles updating application status
func (h *URLAHandler) UpdateApplicationStatus(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.urlaService.UpdateApplicationStatus(idStr, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// SaveApplication handles saving application data (auto-save)
func (h *URLAHandler) SaveApplication(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract nextFormStep if provided
	var nextFormStep string
	if val, ok := req["nextFormStep"].(string); ok {
		nextFormStep = val
	}

	// Save borrower information if provided
	if borrowerData, ok := req["borrower"].(map[string]interface{}); ok {
		err := h.urlaService.SaveBorrowerData(idStr, borrowerData, nextFormStep)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save borrower data: " + err.Error()})
			return
		}
	}

	// Save co-borrower information if provided
	if coBorrowerData, ok := req["coBorrower"].(map[string]interface{}); ok {
		log.Printf("SaveApplication: Saving co-borrower data: %+v", coBorrowerData)
		err := h.urlaService.SaveCoBorrowerData(idStr, coBorrowerData, nextFormStep)
		if err != nil {
			log.Printf("SaveApplication: Error saving co-borrower data: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save co-borrower data: " + err.Error()})
			return
		}
	}

	// Save loan information if provided
	if loanData, ok := req["loan"].(map[string]interface{}); ok {
		err := h.urlaService.SaveLoanData(idStr, loanData, nextFormStep)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save loan data: " + err.Error()})
			return
		}
	}

	// If only nextFormStep is provided (no borrower, coBorrower, or loan data), update the form step directly
	if nextFormStep != "" && req["borrower"] == nil && req["coBorrower"] == nil && req["loan"] == nil {
		err := h.urlaService.UpdateCurrentFormStep(idStr, nextFormStep)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update form step: " + err.Error()})
			return
		}
	}

	// TODO: Save other sections (property, employment, income, assets, liabilities) as needed

	c.JSON(http.StatusOK, gin.H{"message": "Application saved"})
}

// GetApplicationProgress handles getting application completion progress
func (h *URLAHandler) GetApplicationProgress(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	progress, err := h.urlaService.GetDealProgress(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Progress not found"})
		return
	}

	c.JSON(http.StatusOK, progress)
}

// UpdateApplicationProgressSection handles updating a section's completion status
func (h *URLAHandler) UpdateApplicationProgressSection(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var req struct {
		Section  string `json:"section" binding:"required"`
		Complete bool   `json:"complete"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.urlaService.UpdateDealProgressSection(idStr, req.Section, req.Complete)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated successfully"})
}

// UpdateApplicationProgressNotes handles updating progress notes
func (h *URLAHandler) UpdateApplicationProgressNotes(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.urlaService.UpdateDealProgressNotes(idStr, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notes updated successfully"})
}

// GetMyApplications handles getting applications for the current user (employee or applicant)
func (h *URLAHandler) GetMyApplications(c *gin.Context) {
	// Force log flush immediately
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Printf("=== GetMyApplications: START ===")
	
	userID, exists := middleware.GetUserID(c)
	if !exists {
		log.Printf("GetMyApplications: No user ID found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	log.Printf("GetMyApplications: Processing request for user ID: %s", userID)
	log.Printf("GetMyApplications: About to call GetApplicationsByBorrower for user %s", userID)

	// Both borrowers and employees now use UUID strings
	// Try to get borrower applications first
	applications, err := h.urlaService.GetApplicationsByBorrower(userID)
	log.Printf("GetMyApplications: GetApplicationsByBorrower returned %d applications, error: %v", len(applications), err)
	if err != nil {
		log.Printf("GetMyApplications: Error fetching borrower applications for user %s: %v", userID, err)
		// If borrower lookup fails with a real error (not just no rows), try as employee
		// But first check if it's a "no rows" case - that's not an error, just empty result
		employeeApplications, employeeErr := h.urlaService.GetApplicationsByEmployee(userID)
		if employeeErr != nil {
			log.Printf("GetMyApplications: Error fetching employee applications for user %s: %v", userID, employeeErr)
			// Return empty array - user might not have any applications yet
			log.Printf("GetMyApplications: Returning empty applications array for user %s", userID)
			c.JSON(http.StatusOK, gin.H{"applications": []services.ApplicationResponse{}})
			return
		}
		// If employee lookup succeeds, use those results
		// But log a warning since this suggests the user might be misidentified
		if len(employeeApplications) > 0 {
			log.Printf("GetMyApplications: Found employee applications for user %s, but borrower lookup failed", userID)
		}
		applications = employeeApplications
	}

	// Ensure applications is never nil - convert to empty slice if needed
	if applications == nil {
		log.Printf("GetMyApplications: applications is nil, converting to empty slice")
		applications = []services.ApplicationResponse{}
	}

	log.Printf("GetMyApplications: Returning %d applications for user %s", len(applications), userID)
	c.JSON(http.StatusOK, gin.H{"applications": applications})
	log.Printf("=== GetMyApplications: END ===")
}

// SendVerificationCode handles sending verification code via email or SMS
func (h *URLAHandler) SendVerificationCode(c *gin.Context) {
	var req services.SendVerificationCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.urlaService.SendVerificationCode(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification code sent successfully"})
}

// VerifyAndCreateBorrower handles verifying code and creating borrower account with deal
// Returns auth tokens for seamless login
func (h *URLAHandler) VerifyAndCreateBorrower(c *gin.Context) {
	var req services.VerifyAndCreateBorrowerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.urlaService.VerifyAndCreateBorrower(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

