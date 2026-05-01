package services

import (
	"encoding/json"
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

type SignupData struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	OTP      string `json:"otp"`
}

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

func (s *AuthService) Signup(name, emailStr, passwordStr string) error {

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

	// serialize signup data
	data := SignupData{
		Name:     name,
		Email:    emailStr,
		Password: hashedPassword,
		OTP:      hashedOTP,
	}

	dataBytes, err := json.Marshal(data)
	if err != nil {
		return errors.New("failed to process signup data")
	}

	// store SignupData in Redis
	key := "otp:verify:" + emailStr
	if err := s.redis.Client.Set(
		cache.Ctx,
		key,
		dataBytes,
		time.Duration(s.cfg.OTP.ExpiryMinutes)*time.Minute,
	).Err(); err != nil {
		return errors.New("failed to store session in Redis: " + err.Error())
	}

	logger.Log.Infof("OTP sent to %s", emailStr)

	return nil
}

//resend otp

func (s *AuthService) ResendOTP(emailStr string) error {

	// check if user exists and is verified in Postgres
	var user models.User
	err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err == nil && user.IsVerified {
		return errors.New("user already verified")
	}

	// check if signup session exists in Redis
	key := "otp:verify:" + emailStr
	val, err := s.redis.Client.Get(cache.Ctx, key).Result()
	if err != nil {
		return errors.New("signup session expired or not found")
	}

	var data SignupData
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return errors.New("invalid session data")
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

	data.OTP = hashedOTP

	newData, err := json.Marshal(data)
	if err != nil {
		return errors.New("failed to process session data")
	}

	// send email
	if err := s.emailService.SendOTP(emailStr, otpCode); err != nil {
		return err
	}

	// store updated SignupData in Redis
	if err := s.redis.Client.Set(
		cache.Ctx,
		key,
		newData,
		time.Duration(s.cfg.OTP.ExpiryMinutes)*time.Minute,
	).Err(); err != nil {
		return errors.New("failed to store session in Redis: " + err.Error())
	}

	logger.Log.Infof("OTP resent to %s", emailStr)

	return nil
}

//verify otp

func (s *AuthService) VerifyOTP(emailStr, otpCode string) error {

	var user models.User
	err := s.repo.FindOneWhere(&user, "email = ?", emailStr)
	if err == nil && user.IsVerified {
		return errors.New("already verified")
	}

	key := "otp:verify:" + emailStr

	val, err := s.redis.Client.Get(cache.Ctx, key).Result()
	if err != nil {
		return errors.New("OTP expired or session not found")
	}

	var data SignupData
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return errors.New("invalid session data")
	}

	if !password.ComparePassword(data.OTP, otpCode) {
		return errors.New("invalid OTP")
	}

	// create user in Postgres now that OTP is valid
	newUser := models.User{
		Name:       data.Name,
		Email:      data.Email,
		Password:   data.Password,
		Role:       "user",
		IsVerified: true,
		IsBlocked:  false,
	}

	if err := s.repo.Insert(&newUser); err != nil {
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