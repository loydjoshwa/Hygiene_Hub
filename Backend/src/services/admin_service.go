package services

import (
	"errors"
	"hygienehub/internal/cache"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"time"
)

type AdminService struct {
	repo  repository.PgSQLRepository
	redis *cache.Redis
}

func NewAdminService(repo repository.PgSQLRepository, redis *cache.Redis) *AdminService {
	return &AdminService{repo: repo, redis: redis}
}

// GetDashboardStats returns stats for the admin dashboard
func (s *AdminService) GetDashboardStats() (*dto.DashboardStatsResponse, error) {
	var totalUsers int64
	var totalProducts int64

	if err := s.repo.Count(&models.User{}, &totalUsers); err != nil {
		return nil, errors.New("failed to count users")
	}

	if err := s.repo.Count(&models.Product{}, &totalProducts); err != nil {
		return nil, errors.New("failed to count products")
	}

	return &dto.DashboardStatsResponse{
		TotalUsers:    totalUsers,
		TotalProducts: totalProducts,
	}, nil
}

// UpdateUser updates user details
func (s *AdminService) UpdateUser(userID string, req *dto.UpdateUserRequest) (*models.User, error) {
	var user models.User
	_, err := s.repo.FindByID(&user, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	err = s.repo.UpdateByFields(&models.User{}, userID, updates)
	if err != nil {
		return nil, err
	}

	// Fetch updated user
	result, err := s.repo.FindByID(&models.User{}, userID)
	if err != nil {
		return nil, err
	}

	updatedUser, ok := result.(*models.User)
	if !ok {
		return nil, errors.New("failed to cast updated user")
	}

	return updatedUser, nil
}

// UpdateUserBlockStatus blocks or unblocks a user
func (s *AdminService) UpdateUserBlockStatus(userID string, req *dto.BlockUserRequest) error {
	var user models.User
	_, err := s.repo.FindByID(&user, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Role == "admin" {
		return errors.New("cannot block an admin")
	}

	updates := map[string]interface{}{
		"is_blocked": req.IsBlocked,
	}
	err = s.repo.UpdateByFields(&models.User{}, userID, updates)
	if err != nil {
		return err
	}

	if req.IsBlocked {
		// Blacklist the user globally
		return s.redis.Client.Set(cache.Ctx, "blacklist:user:"+userID, "blocked", 24*time.Hour).Err()
	} else {
		// Remove from blacklist
		return s.redis.Client.Del(cache.Ctx, "blacklist:user:"+userID).Err()
	}
}
