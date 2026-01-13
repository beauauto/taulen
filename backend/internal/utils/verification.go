package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

// GenerateVerificationCode generates a random 6-digit verification code
func GenerateVerificationCode() (string, error) {
	code := ""
	for i := 0; i < 6; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", fmt.Errorf("failed to generate verification code: %w", err)
		}
		code += fmt.Sprintf("%d", n.Int64())
	}
	return code, nil
}
