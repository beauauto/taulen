package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

// Config holds application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	MongoDB  MongoDBConfig
	JWT      JWTConfig
	CORS     CORSConfig
	FileUpload FileUploadConfig
	Logging  LoggingConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Host        string
	Port        int
	Environment string // dev, staging, prod
}

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// DSN returns the PostgreSQL connection string
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

// MongoDBConfig holds MongoDB connection configuration
type MongoDBConfig struct {
	Host     string
	Port     int
	Database string
	Username string
	Password string
}

// URI returns the MongoDB connection URI
func (m MongoDBConfig) URI() string {
	if m.Username != "" && m.Password != "" {
		return fmt.Sprintf("mongodb://%s:%s@%s:%d/%s",
			m.Username, m.Password, m.Host, m.Port, m.Database)
	}
	return fmt.Sprintf("mongodb://%s:%d/%s", m.Host, m.Port, m.Database)
}

// JWTConfig holds JWT authentication configuration
type JWTConfig struct {
	Secret            string
	AccessTokenExpiry time.Duration
	RefreshTokenExpiry time.Duration
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

// FileUploadConfig holds file upload configuration
type FileUploadConfig struct {
	MaxSize      int64  // in bytes
	AllowedTypes []string
	StoragePath  string
}

// LoggingConfig holds logging configuration
type LoggingConfig struct {
	Level  string // debug, info, warn, error
	Format string // json, text
}

// Load loads configuration from environment variables using Viper
func Load() (*Config, error) {
	// Load .env file first (if it exists) using godotenv
	_ = godotenv.Load()
	_ = godotenv.Load(".env")
	_ = godotenv.Load("./backend/.env")

	// Set up Viper
	viper.SetEnvPrefix("TAULEN")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Set defaults
	setDefaults()

	config := &Config{
		Server: ServerConfig{
			Host:        viper.GetString("server.host"),
			Port:        viper.GetInt("server.port"),
			Environment: viper.GetString("server.environment"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("database.host"),
			Port:     viper.GetInt("database.port"),
			User:     viper.GetString("database.user"),
			Password: viper.GetString("database.password"),
			DBName:   viper.GetString("database.dbname"),
			SSLMode:  viper.GetString("database.sslmode"),
		},
		MongoDB: MongoDBConfig{
			Host:     viper.GetString("mongodb.host"),
			Port:     viper.GetInt("mongodb.port"),
			Database: viper.GetString("mongodb.database"),
			Username: viper.GetString("mongodb.username"),
			Password: viper.GetString("mongodb.password"),
		},
		JWT: JWTConfig{
			Secret:            viper.GetString("jwt.secret"),
			AccessTokenExpiry: viper.GetDuration("jwt.access_token_expiry"),
			RefreshTokenExpiry: viper.GetDuration("jwt.refresh_token_expiry"),
		},
		CORS: CORSConfig{
			AllowedOrigins: parseStringSlice(viper.GetString("cors.allowed_origins")),
			AllowedMethods: parseStringSlice(viper.GetString("cors.allowed_methods")),
			AllowedHeaders: parseStringSlice(viper.GetString("cors.allowed_headers")),
		},
		FileUpload: FileUploadConfig{
			MaxSize:      viper.GetInt64("file_upload.max_size"),
			AllowedTypes: parseStringSlice(viper.GetString("file_upload.allowed_types")),
			StoragePath:  viper.GetString("file_upload.storage_path"),
		},
		Logging: LoggingConfig{
			Level:  viper.GetString("logging.level"),
			Format: viper.GetString("logging.format"),
		},
	}

	// Validate required configuration
	if err := validate(config); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return config, nil
}

// setDefaults sets default values for configuration
func setDefaults() {
	// Server defaults
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.environment", "dev")

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5434)
	viper.SetDefault("database.user", "taulen")
	viper.SetDefault("database.password", "taulen_dev_password")
	viper.SetDefault("database.dbname", "taulen_db")
	viper.SetDefault("database.sslmode", "disable")

	// MongoDB defaults
	viper.SetDefault("mongodb.host", "localhost")
	viper.SetDefault("mongodb.port", 27018)
	viper.SetDefault("mongodb.database", "taulen_mongo")
	viper.SetDefault("mongodb.username", "")
	viper.SetDefault("mongodb.password", "")

	// JWT defaults
	viper.SetDefault("jwt.secret", "change-me-in-production")
	viper.SetDefault("jwt.access_token_expiry", "15m")
	viper.SetDefault("jwt.refresh_token_expiry", "7d")

	// CORS defaults
	viper.SetDefault("cors.allowed_origins", "http://localhost:3000")
	viper.SetDefault("cors.allowed_methods", "GET,POST,PUT,DELETE,OPTIONS")
	viper.SetDefault("cors.allowed_headers", "Content-Type,Authorization")

	// File upload defaults
	viper.SetDefault("file_upload.max_size", 10*1024*1024) // 10MB
	viper.SetDefault("file_upload.allowed_types", "image/jpeg,image/png,image/gif,image/webp,application/pdf")
	viper.SetDefault("file_upload.storage_path", "./storage/uploads")

	// Logging defaults
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.format", "text")
}

// parseStringSlice parses a comma-separated string into a slice
func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// validate validates the configuration
func validate(cfg *Config) error {
	if cfg.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}
	if cfg.Database.User == "" {
		return fmt.Errorf("database user is required")
	}
	if cfg.Database.Password == "" {
		return fmt.Errorf("database password is required")
	}
	if cfg.Database.DBName == "" {
		return fmt.Errorf("database name is required")
	}
	if cfg.MongoDB.Host == "" {
		return fmt.Errorf("mongodb host is required")
	}
	if cfg.MongoDB.Database == "" {
		return fmt.Errorf("mongodb database name is required")
	}
	if cfg.JWT.Secret == "" || cfg.JWT.Secret == "change-me-in-production" {
		if cfg.Server.Environment == "prod" {
			return fmt.Errorf("JWT secret must be set in production")
		}
	}
	return nil
}
