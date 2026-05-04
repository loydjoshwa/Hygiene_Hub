package models

type Config struct {
	Server struct {
		Port string
	}
	DB struct {
		Host     string
		Port     int
		User     string
		Password string
		Name     string
		SSLMode  string
		TimeZone string
	}

	JWT struct {
		AccessSecret     string
		RefreshSecret    string
		AccessTTLMinutes int
		RefreshTTLHours  int
		MaxSessionHours  int
	}
	SMTP struct {
		Host     string
		Port     int
		Username string
		Password string
		From     string
	}

	OTP struct {
		Length        int
		ExpiryMinutes int
	}

	Redis struct {
		Host string
		Port string
	}
}
