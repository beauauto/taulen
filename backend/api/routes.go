package api

import (
	"github.com/gin-gonic/gin"
	"taulen/backend/internal/config"
	"taulen/backend/internal/handlers"
	"taulen/backend/internal/middleware"
	"taulen/backend/internal/services"
)

// SetupRoutes configures all API routes
func SetupRoutes(cfg *config.Config) *gin.Engine {
	// Set Gin mode based on environment
	if cfg.Server.Environment == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Apply CORS middleware
	router.Use(middleware.CORSMiddleware(&cfg.CORS))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "taulen-backend",
		})
	})

	// Initialize services
	authService := services.NewAuthService(cfg)
	authHandler := handlers.NewAuthHandler(authService)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", middleware.AuthMiddleware(authService.GetJWTManager()), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(authService.GetJWTManager()), authHandler.GetMe)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService.GetJWTManager()))
		{
			// Admin routes
			adminHandler := handlers.NewAdminHandler(authService)
			admin := protected.Group("/admin")
			{
				admin.POST("/employees", adminHandler.CreateEmployee)
			}

			// URLA routes
			urlaService := services.NewURLAService()
			urlaHandler := handlers.NewURLAHandler(urlaService)
			
			urla := protected.Group("/urla")
			{
				urla.POST("/applications", urlaHandler.CreateApplication)
				urla.GET("/applications", urlaHandler.GetMyApplications)
				urla.GET("/applications/:id", urlaHandler.GetApplication)
				urla.PUT("/applications/:id/status", urlaHandler.UpdateApplicationStatus)
				urla.POST("/applications/:id/save", urlaHandler.SaveApplication)
				urla.GET("/applications/:id/progress", urlaHandler.GetApplicationProgress)
			}
		}
	}

	return router
}
