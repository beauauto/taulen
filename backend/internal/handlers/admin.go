package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"taulen/backend/internal/middleware"
	"taulen/backend/internal/services"
)

// AdminHandler handles admin-related HTTP requests
type AdminHandler struct {
	authService *services.AuthService
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(authService *services.AuthService) *AdminHandler {
	return &AdminHandler{
		authService: authService,
	}
}

// CreateEmployeeRequest represents a request to create an employee account
type CreateEmployeeRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=loan_officer underwriter processor admin"`
}

// CreateEmployee handles creating a new employee account (admin only)
func (h *AdminHandler) CreateEmployee(c *gin.Context) {
	// Verify user is authenticated
	_, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// TODO: Check if user is admin (need to get user and check role)
	// For now, allow any authenticated user to create employees
	// In production, add role check here

	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create employee using auth service
	employeeReq := services.CreateEmployeeRequest{
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      req.Role,
	}

	employee, err := h.authService.CreateEmployee(employeeReq)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "employee with this email already exists" || err.Error() == "email already registered as applicant" {
			statusCode = http.StatusConflict
		}
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, employee)
}
