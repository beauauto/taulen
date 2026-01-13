package services

import (
	"encoding/json"
	"fmt"
	"io"
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
		log.Printf("SMS Verification Code for %s: %s (Twilio not configured - AccountSID: %s, FromPhone: %s)", 
			toPhone, code, s.accountSID, s.fromPhone)
		return nil
	}
	
	log.Printf("Attempting to send SMS to %s using Twilio Account: %s, From: %s", toPhone, s.accountSID, s.fromPhone)

	// Format phone number (remove non-digits, add +1 for US)
	phone := strings.ReplaceAll(toPhone, "-", "")
	phone = strings.ReplaceAll(phone, "(", "")
	phone = strings.ReplaceAll(phone, ")", "")
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, ".", "")
	
	// Validate phone number has only digits (or starts with +)
	if phone == "" {
		return fmt.Errorf("phone number cannot be empty")
	}
	
	// If it doesn't start with +, ensure it's a valid US number (10 digits)
	if !strings.HasPrefix(phone, "+") {
		// Remove any leading 1 (US country code)
		if strings.HasPrefix(phone, "1") && len(phone) == 11 {
			phone = phone[1:]
		}
		// Validate it's exactly 10 digits
		if len(phone) != 10 {
			return fmt.Errorf("phone number must be 10 digits (US format)")
		}
		// Check all characters are digits
		for _, r := range phone {
			if r < '0' || r > '9' {
				return fmt.Errorf("phone number contains invalid characters")
			}
		}
		phone = "+1" + phone
	} else {
		// If it starts with +, validate the format
		// Should be +1 followed by 10 digits
		if !strings.HasPrefix(phone, "+1") {
			return fmt.Errorf("phone number must be a US number (+1XXXXXXXXXX)")
		}
		if len(phone) != 12 { // +1 + 10 digits
			return fmt.Errorf("phone number must be in format +1XXXXXXXXXX (12 characters total)")
		}
	}
	
	log.Printf("Formatted phone number: %s (original: %s)", phone, toPhone)

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

	// Read response body for error details
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read SMS response body: %v", err)
	}

	// Log the full response for debugging (both success and error)
	log.Printf("=== Twilio API Response ===")
	log.Printf("Status Code: %d", resp.StatusCode)
	log.Printf("Response Body: %s", string(body))
	
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		
		// Try to parse Twilio error response
		var twilioError struct {
			Code     int    `json:"code"`
			Message  string  `json:"message"`
			Status   int    `json:"status"`
			MoreInfo string `json:"more_info,omitempty"`
		}
		if err := json.Unmarshal(body, &twilioError); err == nil && twilioError.Message != "" {
			log.Printf("Parsed Twilio Error - Code: %d, Status: %d, Message: %s, MoreInfo: %s", 
				twilioError.Code, twilioError.Status, twilioError.Message, twilioError.MoreInfo)
			// Return user-friendly error message
			errorMsg := twilioError.Message
			if twilioError.Code == 21211 {
				errorMsg = "Invalid phone number format. Please enter a valid phone number."
			} else if twilioError.Code == 21608 {
				errorMsg = "This phone number is not verified in Twilio. For trial accounts, you must verify the phone number at twilio.com/user/account/phone-numbers/verified before sending SMS. Please verify your phone number or contact support."
			} else if twilioError.Code == 21610 {
				errorMsg = "This phone number is not verified. Please verify your phone number in Twilio console (trial accounts only)."
			} else if twilioError.Code == 21408 {
				errorMsg = "Permission denied. This phone number cannot receive SMS messages."
			} else if twilioError.Code == 20003 {
				errorMsg = "Authentication failed. Please check Twilio Account SID and Auth Token."
			} else if twilioError.Code == 21212 {
				errorMsg = "Invalid 'To' phone number."
			} else if twilioError.Code == 21214 {
				errorMsg = "Invalid 'From' phone number."
			}
			log.Printf("=== End Twilio Error ===")
			return fmt.Errorf("failed to send SMS: %s (Code: %d)", errorMsg, twilioError.Code)
		}
		
		// If JSON parsing failed, log the raw response
		log.Printf("Failed to parse Twilio error response as JSON. Raw response: %s", string(body))
		log.Printf("=== End Twilio Error ===")
		return fmt.Errorf("failed to send SMS: Twilio API returned status %d. Response: %s", resp.StatusCode, string(body))
	}

	// Parse successful response to get message SID and status
	var twilioResponse struct {
		SID    string `json:"sid"`
		Status string `json:"status"`
		To     string `json:"to"`
		From   string `json:"from"`
		Body   string `json:"body"`
	}
	if err := json.Unmarshal(body, &twilioResponse); err == nil {
		log.Printf("Twilio Message SID: %s", twilioResponse.SID)
		log.Printf("Message Status: %s", twilioResponse.Status)
		log.Printf("To: %s, From: %s", twilioResponse.To, twilioResponse.From)
		log.Printf("Message Body: %s", twilioResponse.Body)
	}
	log.Printf("=== End Twilio Response ===")
	
	// Log success for debugging
	log.Printf("SMS sent successfully to %s", phone)
	return nil
}

