package middleware

import (
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

// AdminMiddleware ensures the logged-in user has the admin role.
// It must be used AFTER AuthMiddleware which sets the "role" in Locals.
func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role != "admin" {
			logger.Log.Warnf("Admin access denied. URL: %s, Method: %s, User Role: %v", c.OriginalURL(), c.Method(), role)
			return c.Status(constant.FORBIDDEN).
				JSON(fiber.Map{"error": "Access forbidden: Admins only"})
		}
		return c.Next()
	}
}
