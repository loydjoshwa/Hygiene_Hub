package dto

type UpdateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type BlockUserRequest struct {
	IsBlocked *bool `json:"is_blocked" validate:"required"` // true for block, false for unblock
}

type DashboardStatsResponse struct {
	TotalUsers    int64 `json:"total_users"`
	TotalProducts int64 `json:"total_products"`
}
