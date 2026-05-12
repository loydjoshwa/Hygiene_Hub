package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/validation"

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
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 2. Parse request body into DTO
	var req dto.AddToCartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 3. Validate request
	if errs := validation.ValidateStruct(req); errs != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	// 4. Call Service to handle business logic
	cartItem, err := cc.cartService.AddToCart(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(cartItem)
}

// GetCart handles fetching the logged-in user's cart
func (cc *CartController) GetCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	cart, err := cc.cartService.GetCart(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(cart)
}

// UpdateCartQuantity handles changing the quantity of a specific cart item
func (cc *CartController) UpdateCartQuantity(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	itemID := c.Params("id") // the ID of the cart item
	
	var req dto.UpdateCartQuantityRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if errs := validation.ValidateStruct(req); errs != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	cartItem, err := cc.cartService.UpdateCartQuantity(userID, itemID, req.Quantity)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(cartItem)
}

// RemoveFromCart handles deleting a single item from the cart
func (cc *CartController) RemoveFromCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	itemID := c.Params("id")
	err := cc.cartService.RemoveFromCart(userID, itemID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Item removed from cart successfully"})
}

// ClearCart handles emptying the entire cart for a user
func (cc *CartController) ClearCart(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	err := cc.cartService.ClearCart(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Cart cleared successfully"})
}
