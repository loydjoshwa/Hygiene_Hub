package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/validation"

	"github.com/gofiber/fiber/v2"
)

type WishlistController struct {
	wishlistService *services.WishlistService
	cartService     *services.CartService
}

func NewWishlistController(wishlistService *services.WishlistService, cartService *services.CartService) *WishlistController {
	return &WishlistController{
		wishlistService: wishlistService,
		cartService:     cartService,
	}
}

func (wc *WishlistController) MoveToCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	id := c.Params("id")

	// 1. Get wishlist item to find product ID
	item, err := wc.wishlistService.GetWishlistItemByID(id, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	// 2. Add to cart
	req := dto.AddToCartRequest{
		ProductID: item.ProductID.String(),
		Quantity:  1,
	}
	_, err = wc.cartService.AddToCart(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add to cart: " + err.Error()})
	}

	// 3. Remove from wishlist
	err = wc.wishlistService.RemoveFromWishlist(id, userID)
	if err != nil {
		// Log the error but don't fail the request since it's already in the cart
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Product added to cart, but failed to remove from wishlist",
			"warning": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Product moved to cart successfully",
	})
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

	_, err := wc.wishlistService.AddToWishlist(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Product added to wishlist successfully",
	})
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
