package services

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"taulen/backend/internal/config"
)

// SMSService handles SMS sending via Twilio
type SMSService struct {
	accountSID string
	authToken  string
	fromPhone  string
}

// NewSMSService creates a new SMS service with Twilio configuration
func NewSMSService(cfg *config.Config) *SMSService {
	return &SMSService{
		accountSID: cfg.Twilio.AccountSID,
		authToken:  cfg.Twilio.AuthToken,
		fromPhone:  cfg.Twilio.FromPhone,
	}
}

// SendVerificationCode sends a verification code via SMS using Twilio
func (s *SMSService) SendVerificationCode(toPhone, code string) error {
	if s.accountSID == "" || s.authToken == "" || s.fromPhone == "" {
		// In development, just log the code
		log.Printf("SMS Verification Code for %s: %s (Twilio not configured)", toPhone, code)
		return nil
	}

	// Format phone number (remove non-digits, add +1 for US)
	phone := strings.ReplaceAll(toPhone, "-", "")
	phone = strings.ReplaceAll(phone, "(", "")
	phone = strings.ReplaceAll(phone, ")", "")
	phone = strings.ReplaceAll(phone, " ", "")
	if !strings.HasPrefix(phone, "+") {
		phone = "+1" + phone
	}

	message := fmt.Sprintf("Your Taulen verification code is: %s. This code expires in 10 minutes.", code)

	// Twilio API endpoint
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.accountSID)

	data := url.Values{}
	data.Set("From", s.fromPhone)
	data.Set("To", phone)
	data.Set("Body", message)

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create SMS request: %w", err)
	}

	req.SetBasicAuth(s.accountSID, s.authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to send SMS: %v", err)
		return fmt.Errorf("failed to send SMS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		log.Printf("SMS API returned status: %d", resp.StatusCode)
		return fmt.Errorf("SMS API returned status: %d", resp.StatusCode)
	}

	return nil
}

