package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"taulen/backend/internal/services"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.Register(req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		errorMsg := err.Error()
		
		// Check for various "already exists" error messages
		if strings.Contains(errorMsg, "already exists") || 
		   strings.Contains(errorMsg, "already registered") ||
		   strings.Contains(errorMsg, "duplicate key") ||
		   strings.Contains(errorMsg, "unique constraint") {
			statusCode = http.StatusConflict
		}
		
		c.JSON(statusCode, gin.H{"error": errorMsg})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// SendVerificationCodeForRegister sends a verification code for registration
func (h *AuthHandler) SendVerificationCodeForRegister(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use URLAService to send verification code
	urlaService := services.NewURLAService(h.authService.GetConfig())
	err := urlaService.SendVerificationCode(services.SendVerificationCodeRequest{
		Email: req.Email,
		Phone: req.Phone,
		// VerificationMethod will be auto-selected (prefers SMS)
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification code sent successfully"})
}

// VerifyAndRegister handles registration with verification code
func (h *AuthHandler) VerifyAndRegister(c *gin.Context) {
	var req services.VerifyAndRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.VerifyAndRegister(req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		errorMsg := err.Error()
		
		// Check for various "already exists" error messages
		if strings.Contains(errorMsg, "already exists") || 
		   strings.Contains(errorMsg, "already registered") ||
		   strings.Contains(errorMsg, "invalid or expired") {
			statusCode = http.StatusBadRequest
		}
		
		c.JSON(statusCode, gin.H{"error": errorMsg})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Refresh handles token refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req services.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.RefreshToken(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Since we're using stateless JWT tokens, logout is handled client-side
	// by discarding the tokens. This endpoint is here for consistency.
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetMe returns current user information
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	email, _ := c.Get("email")

	c.JSON(http.StatusOK, gin.H{
		"id":    userID,
		"email": email,
	})
}
