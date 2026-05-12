package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/validation"

	"github.com/gofiber/fiber/v2"
)

type WishlistController struct {
	wishlistService *services.WishlistService
}

func NewWishlistController(wishlistService *services.WishlistService) *WishlistController {
	return &WishlistController{wishlistService: wishlistService}
}

func (wc *WishlistController) AddToWishlist(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req dto.AddToWishlistRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if errs := validation.ValidateStruct(req); errs != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	wishlistItem, err := wc.wishlistService.AddToWishlist(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(wishlistItem)
}

func (wc *WishlistController) GetWishlist(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	wishlistItems, err := wc.wishlistService.GetWishlist(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(wishlistItems)
}

func (wc *WishlistController) RemoveFromWishlist(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	id := c.Params("id")
	err := wc.wishlistService.RemoveFromWishlist(id, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Item removed from wishlist"})
}
