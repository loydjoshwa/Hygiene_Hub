package services

import (
	"errors"
	"hygienehub/internal/cache"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
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
	var activeUsers int64
	var blockedUsers int64
	var totalProducts int64
	var totalOrders int64
	var totalRevenue int64
	var recentOrders []models.Order

	db := s.repo.GetDB()

	if err := db.Model(&models.User{}).Count(&totalUsers).Error; err != nil {
		return nil, errors.New("failed to count users")
	}

	if err := db.Model(&models.User{}).Where("is_blocked = ?", false).Count(&activeUsers).Error; err != nil {
		return nil, errors.New("failed to count active users")
	}

	if err := db.Model(&models.User{}).Where("is_blocked = ?", true).Count(&blockedUsers).Error; err != nil {
		return nil, errors.New("failed to count blocked users")
	}

	if err := db.Model(&models.Product{}).Count(&totalProducts).Error; err != nil {
		return nil, errors.New("failed to count products")
	}

	if err := db.Model(&models.Order{}).Count(&totalOrders).Error; err != nil {
		return nil, errors.New("failed to count orders")
	}

	if err := db.Model(&models.Order{}).Select("COALESCE(SUM(total), 0)").Row().Scan(&totalRevenue); err != nil {
		return nil, errors.New("failed to calculate revenue")
	}

	// We only need the latest 5 orders for the dashboard overview
	if err := db.Model(&models.Order{}).Order("order_date DESC").Limit(5).Find(&recentOrders).Error; err != nil {
		return nil, errors.New("failed to fetch recent orders")
	}

	return &dto.DashboardStatsResponse{
		TotalOrders:   totalOrders,
		TotalRevenue:  totalRevenue,
		TotalUsers:    totalUsers,
		ActiveUsers:   activeUsers,
		BlockedUsers:  blockedUsers,
		TotalProducts: totalProducts,
		RecentOrders:  recentOrders,
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

	// Use user.ID (UUID) instead of userID (string) for consistency
	err = s.repo.UpdateByFields(&models.User{}, user.ID, updates)
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

	if req.IsBlocked == nil {
		return errors.New("is_blocked status is required")
	}
	isBlocked := *req.IsBlocked

	updates := map[string]interface{}{
		"is_blocked": isBlocked,
	}
	// Use user.ID (UUID) instead of userID (string) to ensure GORM matches the correct type
	err = s.repo.UpdateByFields(&models.User{}, user.ID, updates)
	if err != nil {
		return err
	}

	if isBlocked {
		// Blacklist the user globally in Redis (permanent until unblocked)
		if err := s.redis.Set(cache.Ctx, "blacklist:user:"+userID, "blocked", 0); err != nil {
			return err
		}
		// Revoke all active sessions - use user.ID (UUID) for consistency
		return s.repo.DeleteWhere(&models.RefreshToken{}, "user_id = ?", user.ID)
	} else {
		// Remove from blacklist
		return s.redis.Del(cache.Ctx, "blacklist:user:"+userID)
	}
}
