.PHONY: sqlc-generate sqlc-validate run build test clean

# Generate sqlc code from SQL queries
sqlc-generate:
	@echo "Generating sqlc code..."
	@sqlc generate

# Validate sqlc configuration and SQL files
sqlc-validate:
	@echo "Validating sqlc configuration..."
	@sqlc vet

# Run the server
run:
	@echo "Starting server..."
	@go run cmd/server/main.go

# Build the server
build:
	@echo "Building server..."
	@go build -o bin/server cmd/server/main.go

# Run tests
test:
	@echo "Running tests..."
	@go test ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@go clean
