package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

type AdminController struct {
	adminService *services.AdminService
}

func NewAdminController(service *services.AdminService) *AdminController {
	return &AdminController{adminService: service} 
}

// GetDashboardStats returns stats for the admin dashboard
func (a *AdminController) GetDashboardStats(c *fiber.Ctx) error {
	stats, err := a.adminService.GetDashboardStats()
	if err != nil {
		logger.Log.Error("Get Dashboard Stats failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to get stats"})
	}

	return c.JSON(stats)
}

// UpdateUser modifies an existing user
func (a *AdminController) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateUserRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	user, err := a.adminService.UpdateUser(id, &req)
	if err != nil {
		logger.Log.Error("Update User failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(user)
}

// UpdateUserBlockStatus blocks or unblocks a user
func (a *AdminController) UpdateUserBlockStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.BlockUserRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	logger.Log.Infof("Received block status update request for user %s: is_blocked=%v", id, req.IsBlocked)

	err := a.adminService.UpdateUserBlockStatus(id, &req)
	if err != nil {
		logger.Log.Error("Update User Block Status failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	status := "unblocked"
	if *req.IsBlocked {
		status = "blocked"
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "User successfully " + status,
	}) 
}
