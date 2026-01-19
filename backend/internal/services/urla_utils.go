package services

import (
	"errors"
	"fmt"
	"strings"
)

// normalizeMaritalStatus normalizes marital status to match database constraint
// Database expects: "Married", "Separated", "Unmarried" (capitalized)
// Frontend sends: "MARRIED", "SEPARATED", "UNMARRIED" (uppercase)
func normalizeMaritalStatus(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	if len(status) == 0 {
		return status
	}
	// Capitalize first letter
	return strings.ToUpper(status[:1]) + status[1:]
}

// parseFloatFromString parses a string that may contain currency formatting (commas, dollar signs)
func parseFloatFromString(s string) (float64, error) {
	// Remove currency formatting
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "$", "")
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, errors.New("empty string")
	}
	// Parse as float64
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}
