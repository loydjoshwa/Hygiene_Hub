
package middleware

import (
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/constant"

	"github.com/gofiber/fiber/v2"
)

func AdminMiddleware(repo repository.PgSQLRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {

		// Get user_id from previous middleware (AuthMiddleware)
		userID := c.Locals("user_id")
		if userID == nil || userID == "" {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "User not authenticated"})
		}

		var user models.User

		// Fetch user from DB
		if err := repo.FindOneWhere(&user, "id = ?", userID); err != nil {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "User not found"})
		}

		// Check blocked
		if user.IsBlocked {
			return c.Status(constant.FORBIDDEN).
				JSON(fiber.Map{"error": "Your account has been blocked. Please contact support."})
		}

		// Check admin role
		if user.Role != "admin" {
			return c.Status(constant.FORBIDDEN).
				JSON(fiber.Map{"error": "Admin access required"})
		}

		return c.Next()
	}
}

