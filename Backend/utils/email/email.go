package email

import (
	"fmt"
	"net/smtp"
	"hygienehub/src/models"
)

type Service struct {
	cfg *models.Config
}

func NewEmailService(cfg *models.Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) SendMail(to, subject, body string) error {
	from := s.cfg.SMTP.Username
	fromHeader := s.cfg.SMTP.From

	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version:1.0\r\n"+
			"Content-Type:text/plain;charset=\"UTF-8\"\r\n\r\n"+
			"%s",
		fromHeader, to, subject, body,
	)
	addr := fmt.Sprintf("%s:%d", s.cfg.SMTP.Host, s.cfg.SMTP.Port)

	auth := smtp.PlainAuth("", s.cfg.SMTP.Username, s.cfg.SMTP.Password, s.cfg.SMTP.Host)

	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}

func (s *Service) SendOTP(to string, otp string) error {
	body := fmt.Sprintf(
		"Hello,\n\nYour OTP is:%s\nIt will expire in %d minutes.\n\nThanks,\nHygieneHub Team",
		otp,
		s.cfg.OTP.ExpiryMinutes,
	)
	return s.SendMail(to, "your OTP Code", body)
}

func (s *Service) SendPasswordResetOTP(to, otp string) error {
	subject := "Password Reset Request - HygieneHub"
	body := fmt.Sprintf("Hello,\n\nYou requested a password reset.\nYour OTP is: %s\nIt will expire in %d minutes.\nIf you did not request this, please ignore this email.\n\nThanks,\nHygieneHub Team", otp, s.cfg.OTP.ExpiryMinutes)
	return s.SendMail(to, subject, body)
}
