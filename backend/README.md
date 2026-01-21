# Taulen Backend

Backend API server for the Taulen digital mortgage origination platform.

## Tech Stack

- **Language**: Go 1.24+
- **HTTP Framework**: Gin
- **Database**: PostgreSQL 15 (with pgx/v5 driver)
- **Document Store**: MongoDB 7
- **SQL Code Generation**: sqlc
- **Configuration**: Viper + godotenv
- **Authentication**: JWT

## Prerequisites

- Go 1.24+
- Docker and Docker Compose
- sqlc (for SQL code generation)

## Setup

### 1. Install Dependencies

```bash
go mod download
```

### 2. Install sqlc

```bash
# Using Go
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Or using Homebrew (macOS)
brew install sqlc

# Or using snap (Linux)
sudo snap install sqlc
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (defaults work for local development).

### 4. Start Databases

From the project root:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- MongoDB on `localhost:27017`

### 5. Apply Database Schema

```bash
# Using docker exec (from project root)
docker exec -i taulen-postgres psql -U taulen -d taulen_db < database-schema.sql

# Or from backend directory
docker exec -i taulen-postgres psql -U taulen -d taulen_db < ../database-schema.sql
```

### 6. Generate sqlc Code

After creating the schema, generate type-safe Go code:

```bash
make sqlc-generate
# Or: sqlc generate
```

### 7. Run the Server

```bash
make run
# Or: go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## Development

### Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── api/
│   └── routes.go            # Route setup
├── internal/
│   ├── config/              # Configuration management
│   ├── database/             # Database connections
│   ├── sql/
│   │   ├── schema.sql        # Database schema
│   │   └── queries/          # SQL query files for sqlc
│   ├── db/                   # sqlc generated code (DO NOT EDIT)
│   ├── handlers/             # HTTP handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── middleware/           # HTTP middleware
│   └── utils/                # Utility functions
├── sqlc.yaml                 # sqlc configuration
└── Makefile                  # Build commands
```

### Make Commands

- `make sqlc-generate` - Generate sqlc code from SQL queries
- `make sqlc-validate` - Validate sqlc configuration
- `make run` - Run the server
- `make build` - Build the server binary
- `make test` - Run tests
- `make clean` - Clean build artifacts

### Adding New SQL Queries

1. Add SQL query to `internal/sql/queries/*.sql`
2. Run `make sqlc-generate` to generate Go code
3. Use generated code in repositories

### API Endpoints

- `GET /health` - Health check endpoint

## Environment Variables

See `.env.example` for all available configuration options.

## Database Connection

The backend connects to:
- **PostgreSQL**: `localhost:5432` (default)
- **MongoDB**: `localhost:27017` (default)

Connection details are configured via environment variables.
