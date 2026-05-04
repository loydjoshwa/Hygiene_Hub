package jwt

import (
	"errors"
	"hygienehub/src/models"
	"time"
	"github.com/golang-jwt/jwt"
)

type Manager struct {
	accessSecret   string
	refreshSecret string
	accessTTL      time.Duration
	refreshTTL  time.Duration
	maxSession  time.Duration
}

func NewJWTManager (cfg *models.Config) *Manager {
	return &Manager{
		accessSecret:cfg.JWT.AccessSecret,
		refreshSecret: cfg.JWT.RefreshSecret,
		accessTTL: time.Duration(cfg.JWT.AccessTTLMinutes)*time.Minute,
		refreshTTL: time.Duration(cfg.JWT.RefreshTTLHours)* time.Hour,
		maxSession: time.Duration(cfg.JWT.MaxSessionHours)*time.Hour,
	}
}

func (j *Manager) GenerateAccessToken(userId, role, sessionId string) (string ,error){
	claims:=jwt.MapClaims{
		"user_id":userId,
		"role":role,
		"session_id":sessionId,
		"exp":time.Now().Add(j.accessTTL).Unix(),
		}
		token:=jwt.NewWithClaims(jwt.SigningMethodHS256,claims)
		return token.SignedString([]byte(j.accessSecret))
}

func (j *Manager) GenerateRefreshToken(userId,role,sessionId string) (string, error){
	claims:=jwt.MapClaims{
		"user_id":userId,
		"role":role,
		"session_id":sessionId,
		"exp":time.Now().Add(j.refreshTTL).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,claims)
	return token.SignedString([]byte(j.refreshSecret))
}

func (j *Manager) ValidateAccessToken(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		return []byte(j.accessSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid access token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}

func (j *Manager) ValidateRefresh(tokenStr string)(jwt.MapClaims,error){
	token,err:=jwt.Parse(tokenStr, func(t *jwt.Token) (any, error){
		return []byte(j.refreshSecret),nil
	})
	if err !=nil || !token.Valid {
		return nil,errors.New("invalid refresh token")
	}

	claims,ok:=token.Claims.(jwt.MapClaims)
	if !ok{
		return nil,errors.New("invalid token claims")
	}

	return claims,nil
}