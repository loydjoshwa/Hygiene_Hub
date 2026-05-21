package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

// CartController handles the HTTP requests for cart operations
type CartController struct {
	cartService *services.CartService
}

// NewCartController injects the CartService dependency
func NewCartController(cartService *services.CartService) *CartController {
	return &CartController{cartService: cartService}
}

// AddToCart handles adding a product to the user's cart
func (cc *CartController) AddToCart(c *fiber.Ctx) error {
	// 1. Get UserID from the auth middleware
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 2. Parse and Validate request
	var req dto.AddToCartRequest
	if !parseAndValidate(c, &req) {
		return nil
	}

	// 3. Call Service to handle business logic
	_, err := cc.cartService.AddToCart(userID, &req)
	if err != nil {
		logger.Log.Error("Add to cart failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.CREATED).JSON(fiber.Map{
		"message": "Product added to cart successfully",
	})
}

// GetCart handles fetching the logged-in user's cart
func (cc *CartController) GetCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	cart, err := cc.cartService.GetCart(userID)
	if err != nil {
		logger.Log.Error("Get cart failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(cart)
}

// UpdateCartQuantity handles changing the quantity of a specific cart item
func (cc *CartController) UpdateCartQuantity(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	itemID := c.Params("id") // the ID of the cart item

	var req dto.UpdateCartQuantityRequest
	if !parseAndValidate(c, &req) {
		return nil
	}

	_, err := cc.cartService.UpdateCartQuantity(userID, itemID, req.Quantity)
	if err != nil {
		logger.Log.Error("Update cart quantity failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Cart quantity updated successfully",
	})
}

// RemoveFromCart handles deleting a single item from the cart
func (cc *CartController) RemoveFromCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	itemID := c.Params("id")
	err := cc.cartService.RemoveFromCart(userID, itemID)
	if err != nil {
		logger.Log.Error("Remove from cart failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{"message": "Item removed from cart successfully"})
}

// ClearCart handles emptying the entire cart for a user
func (cc *CartController) ClearCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	err := cc.cartService.ClearCart(userID)
	if err != nil {
		logger.Log.Error("Clear cart failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{"message": "Cart cleared successfully"})
}
