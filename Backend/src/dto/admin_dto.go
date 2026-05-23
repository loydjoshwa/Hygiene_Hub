package dto

import (
	"hygienehub/src/models"
)

type UpdateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type BlockUserRequest struct {
	IsBlocked *bool `json:"is_blocked" form:"is_blocked" query:"is_blocked"` // true for block, false for unblock
}

type DashboardStatsResponse struct {
	TotalOrders   int64          `json:"total_orders"`
	TotalRevenue  int64          `json:"total_revenue"`
	TotalUsers    int64          `json:"total_users"`
	ActiveUsers   int64          `json:"active_users"`
	BlockedUsers  int64          `json:"blocked_users"`
	TotalProducts int64          `json:"total_products"`
	RecentOrders  []models.Order `json:"recent_orders"`
}
