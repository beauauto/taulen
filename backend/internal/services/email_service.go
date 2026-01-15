package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"taulen/backend/internal/config"
)

// EmailService handles email sending via Twilio SendGrid API
type EmailService struct {
	apiKey    string
	fromEmail string
	fromName  string
}

// NewEmailService creates a new email service with SendGrid configuration
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		apiKey:    cfg.SendGrid.APIKey,
		fromEmail: cfg.SendGrid.FromEmail,
		fromName:  cfg.SendGrid.FromName,
	}
}

// SendVerificationCode sends a verification code via email using Twilio SendGrid API
func (s *EmailService) SendVerificationCode(toEmail, code string) error {
	if s.apiKey == "" {
		log.Printf("Email Verification Code for %s: %s (SendGrid not configured - API Key missing)", toEmail, code)
		return fmt.Errorf("SendGrid API key is not configured")
	}

	log.Printf("Attempting to send verification email to %s using SendGrid", toEmail)

	// SendGrid API v3 Mail Send endpoint
	apiURL := "https://api.sendgrid.com/v3/mail/send"

	// Prepare email content
	emailBody := fmt.Sprintf(`
Hello,

Your verification code for Taulen is: %s

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The Taulen Team
`, code)

	// SendGrid API request payload
	payload := map[string]interface{}{
		"personalizations": []map[string]interface{}{
			{
				"to": []map[string]string{
					{"email": toEmail},
				},
			},
		},
		"from": map[string]string{
			"email": s.fromEmail,
			"name":  s.fromName,
		},
		"subject": "Your Taulen Verification Code",
		"content": []map[string]string{
			{
				"type":  "text/plain",
				"value": emailBody,
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to create email payload: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create email request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for error details
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read email response body: %v", err)
	}

	// Log the response for debugging
	log.Printf("=== SendGrid API Response ===")
	log.Printf("Status Code: %d", resp.StatusCode)
	if len(body) > 0 {
		log.Printf("Response Body: %s", string(body))
	}

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		// Try to parse SendGrid error response
		var sendGridError struct {
			Errors []struct {
				Message string `json:"message"`
				Field   string `json:"field,omitempty"`
				Help    string `json:"help,omitempty"`
			} `json:"errors"`
		}
		if err := json.Unmarshal(body, &sendGridError); err == nil && len(sendGridError.Errors) > 0 {
			errorMsg := sendGridError.Errors[0].Message
			log.Printf("SendGrid Error: %s", errorMsg)
			log.Printf("=== End SendGrid Error ===")
			return fmt.Errorf("failed to send verification email: %s", errorMsg)
		}

		log.Printf("Failed to parse SendGrid error response. Raw response: %s", string(body))
		log.Printf("=== End SendGrid Error ===")
		return fmt.Errorf("failed to send verification email: SendGrid API returned status %d. Response: %s", resp.StatusCode, string(body))
	}

	log.Printf("Email sent successfully to %s", toEmail)
	log.Printf("=== End SendGrid Response ===")

	return nil
}
