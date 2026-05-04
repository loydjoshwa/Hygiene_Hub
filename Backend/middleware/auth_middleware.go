package middleware

import (
	"hygienehub/internal/cache"
	"hygienehub/utils/constant"
	"hygienehub/utils/jwt"
	"hygienehub/utils/logger"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func AuthMiddleware(jwtManager *jwt.Manager, redisCache *cache.Redis) fiber.Handler {
	return func(c *fiber.Ctx) error {

		authHeader := c.Get("Authorization")
		if authHeader == "" {
			logger.Log.Warnf("AuthMiddleware triggered, but authorization header is missing. URL: %s, Method: %s", c.OriginalURL(), c.Method())
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

		sessionID, ok := claims["session_id"].(string)
		if !ok || sessionID == "" {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Invalid token claims"})
		}

		// Check if session is in Redis blacklist
		err = redisCache.Client.Get(cache.Ctx, "blacklist:session:"+sessionID).Err()
		if err == nil {
			return c.Status(constant.UNAUTHORIZED).
				JSON(fiber.Map{"error": "Session has been revoked"})
		} else if err != redis.Nil {
			return c.Status(constant.INTERNALSERVERERROR).
				JSON(fiber.Map{"error": "Failed to verify session status"})
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
		c.Locals("session_id", sessionID)

		return c.Next()
	}
}