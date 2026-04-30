package email

import (
	"fmt"
	"hygienehub/config"
	"net/smtp"
)

type service struct {
	cfg config.Config
}

func NewEmailService(cfg *config.Config) *service {
	return &service{cfg: *cfg}
}

func (s *service) SendMail(to, subject, body string) error{
	from:=s.cfg.SMTP.Username
	fromHeader := s.cfg.SMTP.From

	msg:=fmt.Sprintf(
		"From:%s\r\n"+
		"To: %s\r\n"+
		"subject:%s\r\n"+
		"MIME-Version:1.0\r\n"+
		"Content-Type:text/plain;charset=\"UTF-8\"\r\n\r\n"+
		"%s",
		fromHeader, to, subject,body,
	)
	addr := fmt.Sprintf("%s:%d", s.cfg.SMTP.Host, s.cfg.SMTP.Port)

	auth:= smtp.PlainAuth("", s.cfg.SMTP.Username, s.cfg.SMTP.Password, s.cfg.SMTP.Host)

	return smtp.SendMail(addr,auth,from,[]string{to},[]byte(msg))
}  

func (s *service) SendOTP(to string, otp string) error{
	body:=fmt.Sprintf(
		"Hello,\n\nYour OTP is:%s\nIt will expire in %d minutes.\n\nThanks,\nHygieneHub Team",
		otp,
		s.cfg.OTP.ExpiryMinutes,
	)
	return s.SendMail(to,"your OTP Code",body)
}