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

// BlockUser blocks a user from logging in
func (u *UserController) BlockUser(c *fiber.Ctx) error {
	id := c.Params("id")

	err := u.userService.BlockUser(id)
	if err != nil {
		logger.Log.Error("Block User failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "User successfully blocked",
	})
}

// UnblockUser unblocks a user
func (u *UserController) UnblockUser(c *fiber.Ctx) error {
	id := c.Params("id")

	err := u.userService.UnblockUser(id)
	if err != nil {
		logger.Log.Error("Unblock User failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "User successfully unblocked",
	})
}
