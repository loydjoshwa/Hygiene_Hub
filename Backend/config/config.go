package config

import (
	"log"
	"os"
	"strconv"
	"hygienehub/src/models"

	"github.com/joho/godotenv"
)

func LoadConfig() *models.Config {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("No .env file found")
	}
	log.Println("ENV DB_HOST:", os.Getenv("DB_HOST"))

	cfg := &models.Config{}

	cfg.Server.Port = getEnv("SERVER_PORT", "8080")

	//database
	cfg.DB.Host = getEnv("DB_HOST", "127.0.0.1")
	cfg.DB.Port = getEnvAsInt("DB_PORT", 5432)
	cfg.DB.User = getEnv("DB_USER", "postgres")
	cfg.DB.Password = getEnv("DB_PASSWORD", "")
	cfg.DB.Name = getEnv("DB_NAME", "hygienehub")
	cfg.DB.SSLMode = getEnv("DB_SSLMODE", "disable")
	cfg.DB.TimeZone = getEnv("DB_TIMEZONE", "Asia/Kolkata")

	//jwt
	cfg.JWT.AccessSecret = getEnv("ACCESS_SECRET", "")
	cfg.JWT.RefreshSecret = getEnv("REFRESH_SECRET", "")
	cfg.JWT.AccessTTLMinutes = getEnvAsInt("ACCESS_TTL_MINUTE", 15)
	cfg.JWT.RefreshTTLHours = getEnvAsInt("REFRESH_TTL_HOUR", 168)
	cfg.JWT.MaxSessionHours = getEnvAsInt("MAX_SESSION", 720)

	//email
	cfg.SMTP.Host = getEnv("SMTP_HOST", "smtp.gmail.com")
	cfg.SMTP.Port = getEnvAsInt("SMTP_PORT", 587)
	cfg.SMTP.Username = getEnv("SMTP_USERNAME", "")
	cfg.SMTP.Password = getEnv("SMTP_PASSWORD", "")
	cfg.SMTP.From = getEnv("SMTP_FROM", "hygienehub <loydjoshwad@gmail.com>")

	//otp
	cfg.OTP.Length = getEnvAsInt("OTP_LENGTH", 5)
	cfg.OTP.ExpiryMinutes = getEnvAsInt("OTP_EXPIRY_MINUTES", 5)

	//redis
	cfg.Redis.Host = getEnv("REDIS_HOST", "127.0.0.1")
	cfg.Redis.Port = getEnv("REDIS_PORT", "6379")

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}