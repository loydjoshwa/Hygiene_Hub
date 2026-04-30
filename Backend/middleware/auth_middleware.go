package middleware

import (
	"hygienehub/utils/constant"
	"hygienehub/utils/jwt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(jwtManager *jwt.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {

		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Authorization header missing"})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Invalid authorization format"})
		}

		token := parts[1]

		claims, err := jwtManager.ValidateAccessToken(token)
		if err != nil {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Invalid or expired token"})
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Invalid token claims"})
		}

		role, _ := claims["role"].(string)

		// Set values in context (Fiber style)
		c.Locals("user_id", userID)
		c.Locals("role", role)

		return c.Next()
	}
}