package controllers

import (
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController(service *services.UserService) *UserController {
	return &UserController{userService: service}
}

// GetAllUsers retrieves all registered users
func (u *UserController) GetAllUsers(c *fiber.Ctx) error {
	users, err := u.userService.GetAllUsers()
	if err != nil {
		logger.Log.Error("Get All Users failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to retrieve users"})
	}

	// We might want to omit sensitive information like password hashes before returning,
	// but for now, we'll return the array. Ideally use a DTO here.
	return c.JSON(users)
}

