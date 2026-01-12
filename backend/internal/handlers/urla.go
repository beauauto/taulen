package handlers

import (
	"net/http"
	"strconv"

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

	// Try to parse as borrower ID (int64), if fails, treat as employee (UUID)
	borrowerID, err := strconv.ParseInt(userID, 10, 64)
	if err == nil {
		// It's a borrower ID
		response, err := h.urlaService.CreateApplicationForBorrower(borrowerID, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, response)
		return
	}

	// It's an employee UUID
	response, err := h.urlaService.CreateApplication(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GetApplication handles retrieving an application by ID
func (h *URLAHandler) GetApplication(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	application, err := h.urlaService.GetApplication(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application)
}

// UpdateApplicationStatus handles updating application status
func (h *URLAHandler) UpdateApplicationStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
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

	err = h.urlaService.UpdateApplicationStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// SaveApplication handles saving application data (auto-save)
func (h *URLAHandler) SaveApplication(c *gin.Context) {
	// TODO: Implement auto-save functionality
	c.JSON(http.StatusOK, gin.H{"message": "Application saved"})
}

// GetApplicationProgress handles getting application completion progress
func (h *URLAHandler) GetApplicationProgress(c *gin.Context) {
	// TODO: Implement progress calculation
	c.JSON(http.StatusOK, gin.H{"progress": 0})
}

// GetMyApplications handles getting applications for the current user (employee or applicant)
func (h *URLAHandler) GetMyApplications(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user type from context (we'll need to add this to middleware)
	// For now, try employee first, then borrower
	applications, err := h.urlaService.GetApplicationsByEmployee(userID)
	if err != nil {
		// Try as borrower
		borrowerID, parseErr := strconv.ParseInt(userID, 10, 64)
		if parseErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
			return
		}
		applications, err = h.urlaService.GetApplicationsByBorrower(borrowerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve applications"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}
