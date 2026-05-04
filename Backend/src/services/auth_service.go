package services

import (
	"encoding/json"
	"errors"
	"hygienehub/internal/cache"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/email"
	"hygienehub/utils/jwt"
	"hygienehub/utils/logger"
	"hygienehub/utils/otp"
	"hygienehub/utils/password"
	"time"

	"github.com/google/uuid"
)

type OTPSession struct {
	OTP          string    `json:"otp"`
	OTPExpiresAt time.Time `json:"otp_expires_at"`
}

type AuthService struct {
	repo         repository.PgSQLRepository
	jwtManager   *jwt.Manager
	emailService *email.Service
	redis        *cache.Redis
	cfg          *models.Config
}

func NewAuthService(
	repo repository.PgSQLRepository,
	jwt *jwt.Manager,
	email *email.Service,
	redis *cache.Redis,
	cfg *models.Config,
) *AuthService {
	return &AuthService{
		repo:         repo,
		jwtManager:   jwt,
		emailService: email,
		redis:        redis,
		cfg:          cfg,
	}
}

// Helper function to generate, email, and store OTP in Redis
func (s *AuthService) handleOTPGeneration(emailStr string, isPasswordReset bool) error {
	otpCode, err := otp.GenerateOTP()
	if err != nil {
		return err
	}

	hashedOTP, err := password.HashPassword(otpCode)
	if err != nil {
		return err
	}

	var key string
	var ttl time.Duration

	if isPasswordReset {
		err = s.emailService.SendPasswordResetOTP(emailStr, otpCode)
		key = "otp:reset:" + emailStr
		ttl = 10 * time.Minute
	} else {
		err = s.emailService.SendOTP(emailStr, otpCode)
		key = "otp:verify:" + emailStr
		ttl = 24 * time.Hour
	}

	if err != nil {
		return err
	}

	data := OTPSession{
		OTP:          hashedOTP,
		OTPExpiresAt: time.Now().Add(time.Duration(s.cfg.OTP.ExpiryMinutes) * time.Minute),
	}

	dataBytes, _ := json.Marshal(data)
	if err := s.redis.Client.Set(cache.Ctx, key, dataBytes, ttl).Err(); err != nil {
		return errors.New("failed to store session in Redis: " + err.Error())
	}

	logger.Log.Infof("OTP sent to %s (Reset: %v)", emailStr, isPasswordReset)
	return nil
}

//signup

func (s *AuthService) Signup(name, emailStr, passwordStr string) error {

	var existing models.User
	_, err := s.repo.FindOneWhere(&existing, "email = ?", emailStr)

	// hash password
	hashedPassword, errPass := password.HashPassword(passwordStr)
	if errPass != nil {
		return errPass
	}

	if err == nil {
		if existing.IsVerified {
			return errors.New("email already exists")
		}
		// Update details if unverified user tries to signup again
		updates := map[string]interface{}{
			"name":     name,
			"password": hashedPassword,
		}
		s.repo.UpdateByFields(&models.User{}, existing.ID, updates)
	} else {
		// Insert unverified user to DB
		newUser := models.User{
			Name:       name,
			Email:      emailStr,
			Password:   hashedPassword,
			Role:       "user",
			IsVerified: false,
			IsBlocked:  false,
		}
		if _, err := s.repo.Insert(&newUser); err != nil {
			return err
		}
	}

	return s.handleOTPGeneration(emailStr, false)
}

//resend otp

func (s *AuthService) ResendOTP(emailStr string) error {

	// check if user exists in Postgres
	var user models.User
	_, err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}
	if user.IsVerified {
		return errors.New("user already verified")
	}

	return s.handleOTPGeneration(emailStr, false)
}

//verify otp

func (s *AuthService) VerifyOTP(emailStr, otpCode string) error {

	var user models.User
	_, err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}
	if user.IsVerified {
		return errors.New("already verified")
	}

	key := "otp:verify:" + emailStr

	val, err := s.redis.Client.Get(cache.Ctx, key).Result()
	if err != nil {
		return errors.New("OTP expired or session not found")
	}

	var data OTPSession
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return errors.New("invalid session data")
	}

	if time.Now().After(data.OTPExpiresAt) {
		return errors.New("OTP has expired. Please resend OTP")
	}

	if !password.ComparePassword(data.OTP, otpCode) {
		return errors.New("invalid OTP")
	}

	// mark user as verified in Postgres
	updates := map[string]interface{}{
		"is_verified": true,
	}
	if err := s.repo.UpdateByFields(&models.User{}, user.ID, updates); err != nil {
		return errors.New("failed to verify user")
	}

	s.redis.Client.Del(cache.Ctx, key)

	return nil
}

//login

func (s *AuthService) Login(emailStr, passwordStr string) (string, string, *models.User, error) {

	var user models.User

	_, err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	if !user.IsVerified {
		return "", "", nil, errors.New("user not verified")
	}

	if user.IsBlocked {
		return "", "", nil, errors.New("user blocked")
	}

	if !password.ComparePassword(user.Password, passwordStr) {
		return "", "", nil, errors.New("invalid credentials")
	}

	// generate session id
	sessionID := uuid.New()

	// generate access token
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID.String(), user.Role, sessionID.String())
	if err != nil {
		return "", "", nil, err
	}

	// generate refresh token

	refreshToken, err := s.jwtManager.GenerateRefreshToken(
		user.ID.String(),
		user.Role,
		sessionID.String(),
	)
	if err != nil {
		return "", "", nil, err
	}

	// store refresh token
	refresh := models.RefreshToken{
		ID:        sessionID,
		UserID:    user.ID,
		Token:     password.HashToken(refreshToken),
		ExpiresAt: time.Now().Add(time.Duration(s.cfg.JWT.RefreshTTLHours) * time.Hour),
	}

	if _, err := s.repo.Insert(&refresh); err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, &user, nil
}

//refresh token

func (s *AuthService) Refresh(token string) (string, string, error) {

	claims, err := s.jwtManager.ValidateRefresh(token)
	if err != nil {
		return "", "", errors.New("invalid token")
	}

	sessionID, ok := claims["session_id"].(string)
	if !ok {
		return "", "", errors.New("invalid token")
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", "", errors.New("invalid token")
	}
	role, ok := claims["role"].(string)
	if !ok {
		return "", "", errors.New("invalid token")
	}

	var stored models.RefreshToken
	_, err = s.repo.FindOneWhere(&stored, "id = ?", sessionID)
	if err != nil {
		return "", "", errors.New("token not found")
	}

	if !password.CompareHashToken(token, stored.Token) {
		return "", "", errors.New("invalid token")
	}

	if time.Now().After(stored.ExpiresAt) {
		return "", "", errors.New("token expired")
	}

	newAccess, err := s.jwtManager.GenerateAccessToken(userID, role, sessionID)
	if err != nil {
		return "", "", err
	}

	newRefresh, err := s.jwtManager.GenerateRefreshToken(userID, role, sessionID)
	if err != nil {
		return "", "", err
	}

	updates := map[string]interface{}{
		"token": password.HashToken(newRefresh),
	}

	s.repo.UpdateByFields(&models.RefreshToken{}, sessionID, updates)

	return newAccess, newRefresh, nil
}

//logout

func (s *AuthService) Logout(sessionID, refreshToken string) error {

	claims, err := s.jwtManager.ValidateRefresh(refreshToken)
	if err != nil {
		return errors.New("invalid token")
	}

	refreshSessionID, ok := claims["session_id"].(string)
	if !ok || refreshSessionID != sessionID {
		return errors.New("invalid token or session mismatch")
	}

	// Blacklist the session_id
	err = s.redis.Client.Set(cache.Ctx, "blacklist:session:"+sessionID, "revoked", time.Duration(s.cfg.JWT.AccessTTLMinutes)*time.Minute).Err()
	if err != nil {
		return errors.New("failed to blacklist session: " + err.Error())
	}

	return s.repo.Delete(&models.RefreshToken{}, sessionID)
}

func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	_, err := s.repo.FindByID(&user, userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

//forgot password
func (s *AuthService) ForgotPassword(emailStr string) error {
	var user models.User
	_, err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}

	if user.IsBlocked {
		return errors.New("account is blocked")
	}

	return s.handleOTPGeneration(emailStr, true)
}

//reset password
func (s *AuthService) ResetPassword(emailStr, otpCode, newPasswordStr string) error {
	var user models.User
	_, err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}

	key := "otp:reset:" + emailStr
	val, err := s.redis.Client.Get(cache.Ctx, key).Result()
	if err != nil {
		return errors.New("OTP expired or invalid")
	}

	var data OTPSession
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return errors.New("invalid session data")
	}

	if time.Now().After(data.OTPExpiresAt) {
		return errors.New("OTP has expired")
	}

	if !password.ComparePassword(data.OTP, otpCode) {
		return errors.New("invalid OTP")
	}

	// hash new password
	hashedNewPassword, err := password.HashPassword(newPasswordStr)
	if err != nil {
		return err
	}

	// update password in DB
	updates := map[string]interface{}{
		"password": hashedNewPassword,
	}
	if err := s.repo.UpdateByFields(&models.User{}, user.ID, updates); err != nil {
		return errors.New("failed to reset password")
	}

	// invalidate all existing refresh tokens for this user
	s.repo.DeleteWhere(&models.RefreshToken{}, "user_id = ?", user.ID)

	// delete OTP session
	s.redis.Client.Del(cache.Ctx, key)

	logger.Log.Infof("Password successfully reset for %s", emailStr)
	return nil
}