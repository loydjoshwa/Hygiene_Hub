package config

import (
	"log"
	"os"
	"strconv"

	"hygienehub/src/models"

	"github.com/joho/godotenv"
)

// Load all environment variables and config values
func LoadConfig() *models.Config {

	// Load .env file
	err := godotenv.Load(".env")

	if err != nil {
		log.Println("No .env file found")
	}

	// Create config object
	cfg := &models.Config{}

	// ================= SERVER =================
	cfg.Server.Port = getEnv("SERVER_PORT", "8080")

	// ================= DATABASE =================
	cfg.DB.Host = getEnv("DB_HOST", "127.0.0.1")
	cfg.DB.Port = getEnvAsInt("DB_PORT", 5432)
	cfg.DB.User = getEnv("DB_USER", "postgres")
	cfg.DB.Password = getEnv("DB_PASSWORD", "")
	cfg.DB.Name = getEnv("DB_NAME", "hygienehub")
	cfg.DB.SSLMode = getEnv("DB_SSLMODE", "disable")
	cfg.DB.TimeZone = getEnv("DB_TIMEZONE", "Asia/Kolkata")

	// ================= JWT =================
	cfg.JWT.AccessSecret = getEnv("ACCESS_SECRET", "")
	cfg.JWT.RefreshSecret = getEnv("REFRESH_SECRET", "")

	cfg.JWT.AccessTTLMinutes = getEnvAsInt("ACCESS_TTL_MINUTE", 15)
	cfg.JWT.RefreshTTLHours = getEnvAsInt("REFRESH_TTL_HOUR", 168)
	cfg.JWT.MaxSessionHours = getEnvAsInt("MAX_SESSION", 720)

	// ================= EMAIL =================
	cfg.SMTP.Host = getEnv("SMTP_HOST", "smtp.gmail.com")
	cfg.SMTP.Port = getEnvAsInt("SMTP_PORT", 587)
	cfg.SMTP.Username = getEnv("SMTP_USERNAME", "")
	cfg.SMTP.Password = getEnv("SMTP_PASSWORD", "")

	cfg.SMTP.From = getEnv(
		"SMTP_FROM",
		"hygienehub <loydjoshwad@gmail.com>",
	)

	// ================= OTP =================
	cfg.OTP.Length = getEnvAsInt("OTP_LENGTH", 5)
	cfg.OTP.ExpiryMinutes = getEnvAsInt("OTP_EXPIRY_MINUTES", 5)

	// ================= REDIS =================
	cfg.Redis.Host = getEnv("REDIS_HOST", "127.0.0.1")
	cfg.Redis.Port = getEnv("REDIS_PORT", "6379")

	// ================= RAZORPAY =================
	cfg.Razorpay.KeyID = getEnv("RAZORPAY_KEY_ID", "")
	cfg.Razorpay.KeySecret = getEnv("RAZORPAY_KEY_SECRET", "")

	return cfg
}

// Get string environment variable
func getEnv(key string, defaultValue string) string {

	value := os.Getenv(key)

	if value == "" {
		return defaultValue
	}

	return value
}

// Get integer environment variable
func getEnvAsInt(key string, defaultValue int) int {

	value := os.Getenv(key)

	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)

	if err != nil {
		return defaultValue
	}

	return intValue
}
