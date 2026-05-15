package services

import (
	"errors"
	"hygienehub/internal/cache"
	"hygienehub/src/models"
	"hygienehub/src/repository"
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

