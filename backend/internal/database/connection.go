package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"taulen/backend/internal/config"
)

// DB holds the PostgreSQL database connection
var DB *sql.DB

// MongoClient holds the MongoDB client
var MongoClient *mongo.Client

// MongoDB holds the MongoDB database instance
var MongoDB *mongo.Database

// Connect establishes connections to PostgreSQL and MongoDB
func Connect(cfg *config.Config) error {
	// Connect to PostgreSQL
	if err := connectPostgreSQL(cfg); err != nil {
		return fmt.Errorf("postgresql connection failed: %w", err)
	}

	// Connect to MongoDB
	if err := connectMongoDB(cfg); err != nil {
		return fmt.Errorf("mongodb connection failed: %w", err)
	}

	return nil
}

// connectPostgreSQL establishes a connection to PostgreSQL
func connectPostgreSQL(cfg *config.Config) error {
	dsn := cfg.Database.DSN()

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	DB = db
	return nil
}

// connectMongoDB establishes a connection to MongoDB
func connectMongoDB(cfg *config.Config) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(cfg.MongoDB.URI())
	
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to mongodb: %w", err)
	}

	// Test the connection
	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping mongodb: %w", err)
	}

	MongoClient = client
	MongoDB = client.Database(cfg.MongoDB.Database)
	return nil
}

// Close closes all database connections
func Close() error {
	var errs []error

	if DB != nil {
		if err := DB.Close(); err != nil {
			errs = append(errs, fmt.Errorf("postgresql close error: %w", err))
		}
	}

	if MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := MongoClient.Disconnect(ctx); err != nil {
			errs = append(errs, fmt.Errorf("mongodb close error: %w", err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing databases: %v", errs)
	}

	return nil
}
