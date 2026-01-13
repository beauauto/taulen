package services

import (
	"fmt"
	"log"
	"net/smtp"
	"taulen/backend/internal/config"
)

// EmailService handles email sending
type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	fromEmail    string
}

// NewEmailService creates a new email service with SMTP configuration
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		smtpHost:     cfg.SMTP.Host,
		smtpPort:     cfg.SMTP.Port,
		smtpUser:     cfg.SMTP.User,
		smtpPassword: cfg.SMTP.Password,
		fromEmail:    cfg.SMTP.FromEmail,
	}
}

// SendVerificationCode sends a verification code via email
func (s *EmailService) SendVerificationCode(toEmail, code string) error {
	subject := "Your Taulen Verification Code"
	body := fmt.Sprintf(`
Hello,

Your verification code for Taulen is: %s

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The Taulen Team
`, code)

	message := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", s.fromEmail, toEmail, subject, body)

	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	err := smtp.SendMail(addr, auth, s.fromEmail, []string{toEmail}, []byte(message))
	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return fmt.Errorf("failed to send verification email: %w", err)
	}

	return nil
}
