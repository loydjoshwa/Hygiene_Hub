package services

import (
	"errors"
	"hygienehub/config"
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

type AuthService struct {
	repo         repository.PgSQLRepository
	jwtManager   *jwt.Manager
	emailService *email.Service
	redis        *cache.Redis
	cfg          *config.Config
}

func NewAuthService(
	repo repository.PgSQLRepository,
	jwt *jwt.Manager,
	email *email.Service,
	redis *cache.Redis,
	cfg *config.Config,
) *AuthService {
	return &AuthService{
		repo:         repo,
		jwtManager:   jwt,
		emailService: email,
		redis:        redis,
		cfg:          cfg,
	}
}

//signup

func (s *AuthService) Signup(name, emailStr, phone, passwordStr string) error {

	var existing models.User
	err := s.repo.FindOneWhere(&existing, "email = ?", emailStr)
	if err == nil {
		return errors.New("email already exists")
	}

	// generate OTP
	otpCode, err := otp.GenerateOTP()
	if err != nil {
		return err
	}

	// hash OTP
	hashedOTP, err := password.HashPassword(otpCode)
	if err != nil {
		return err
	}

	// send email
	if err := s.emailService.SendOTP(emailStr, otpCode); err != nil {
		return err
	}

	// hash password
	hashedPassword, err := password.HashPassword(passwordStr)
	if err != nil {
		return err
	}

	// create user
	user := models.User{
		Name:       name,
		Email:      emailStr,
		Password:   hashedPassword,
		Role:       "user",
		IsVerified: false,
		IsBlocked:  false,
	}

	if err := s.repo.Insert(&user); err != nil {
		return err
	}

	// store OTP in Redis
	key := "otp:verify:" + emailStr
	s.redis.Client.Set(
		cache.Ctx,
		key,
		hashedOTP,
		time.Duration(s.cfg.OTP.ExpiryMinutes)*time.Minute,
	)

	logger.Log.Infof("OTP sent to %s", emailStr)

	return nil
}

//resend otp

func (s *AuthService) ResendOTP(emailStr string) error {

	var user models.User

	// check user exists
	err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}

	// already verified?
	if user.IsVerified {
		return errors.New("user already verified")
	}

	// generate OTP
	otpCode, err := otp.GenerateOTP()
	if err != nil {
		return err
	}

	// hash OTP
	hashedOTP, err := password.HashPassword(otpCode)
	if err != nil {
		return err
	}

	// send email
	if err := s.emailService.SendOTP(emailStr, otpCode); err != nil {
		return err
	}

	// store OTP in Redis (overwrite old)
	key := "otp:verify:" + emailStr
	s.redis.Client.Set(
		cache.Ctx,
		key,
		hashedOTP,
		time.Duration(s.cfg.OTP.ExpiryMinutes)*time.Minute,
	)

	logger.Log.Infof("OTP resent to %s", emailStr)

	return nil
}

//verify otp

func (s *AuthService) VerifyOTP(emailStr, otpCode string) error {

	var user models.User
	err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err != nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("already verified")
	}

	key := "otp:verify:" + emailStr

	storedOTP, err := s.redis.Client.Get(cache.Ctx, key).Result()
	if err != nil {
		return errors.New("OTP expired")
	}

	if !password.ComparePassword(storedOTP, otpCode) {
		return errors.New("invalid OTP")
	}

	updates := map[string]interface{}{
		"is_verified": true,
	}

	if err := s.repo.UpdateByFields(&models.User{}, user.ID, updates); err != nil {
		return err
	}

	s.redis.Client.Del(cache.Ctx, key)

	return nil
}

//login

func (s *AuthService) Login(emailStr, passwordStr string) (string, string, *models.User, error) {

	var user models.User

	err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
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

	// generate access token
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID.String(), user.Role)
	if err != nil {
		return "", "", nil, err
	}

	// generate refresh token
	sessionID := uuid.New()

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

	if err := s.repo.Insert(&refresh); err != nil {
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

	sessionID := claims["session_id"].(string)
	userID := claims["user_id"].(string)
	role := claims["role"].(string)

	var stored models.RefreshToken
	err = s.repo.FindOneWhere(&stored, "id = ?", sessionID)
	if err != nil {
		return "", "", errors.New("token not found")
	}

	if !password.CompareHashToken(token, stored.Token) {
		return "", "", errors.New("invalid token")
	}

	if time.Now().After(stored.ExpiresAt) {
		return "", "", errors.New("token expired")
	}

	newAccess, err := s.jwtManager.GenerateAccessToken(userID, role)
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

func (s *AuthService) Logout(token string) error {

	claims, err := s.jwtManager.ValidateRefresh(token)
	if err != nil {
		return errors.New("invalid token")
	}

	sessionID := claims["session_id"].(string)

	return s.repo.Delete(&models.RefreshToken{}, sessionID)
}

func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := s.repo.FindByID(&user, userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}