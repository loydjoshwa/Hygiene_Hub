package services

import (
	"errors"
	"hygienehub/internal/cache"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"time"
)

type UserService struct {
	repo  repository.PgSQLRepository
	redis *cache.Redis
}

func NewUserService(repo repository.PgSQLRepository, redis *cache.Redis) *UserService {
	return &UserService{repo: repo, redis: redis}
}

// GetAllUsers retrieves all registered users
func (s *UserService) GetAllUsers() ([]*models.User, error) {
	var users []*models.User
	result, err := s.repo.FindAll(&users)
	if err != nil {
		return nil, err
	}

	foundUsers, ok := result.(*[]*models.User)
	if !ok {
		return nil, errors.New("failed to cast users array")
	}

	return *foundUsers, nil
}

// BlockUser blocks a user by ID
func (s *UserService) BlockUser(userID string) error {
	var user models.User
	_, err := s.repo.FindByID(&user, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Role == "admin" {
		return errors.New("cannot block an admin")
	}

	updates := map[string]interface{}{
		"is_blocked": true,
	}
	err = s.repo.UpdateByFields(&models.User{}, userID, updates)
	if err != nil {
		return err
	}

	// Blacklist the user globally (expires in 24 hours just to be safe, though they can't login anyway)
	return s.redis.Client.Set(cache.Ctx, "blacklist:user:"+userID, "blocked", 24*time.Hour).Err()
}

// UnblockUser unblocks a user by ID
func (s *UserService) UnblockUser(userID string) error {
	var user models.User
	_, err := s.repo.FindByID(&user, userID)
	if err != nil {
		return errors.New("user not found")
	}

	updates := map[string]interface{}{
		"is_blocked": false,
	}
	err = s.repo.UpdateByFields(&models.User{}, userID, updates)
	if err != nil {
		return err
	}

	// Remove from blacklist
	return s.redis.Client.Del(cache.Ctx, "blacklist:user:"+userID).Err()
}
