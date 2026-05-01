package routes

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"hygienehub/internal/cache"
	"hygienehub/middleware"
	"hygienehub/src/controllers"
	"hygienehub/src/repository"
	"hygienehub/utils/jwt"
)

func SetUpRoutes(
	app *fiber.App,
	authController *controllers.AuthController,
	jwtManager *jwt.Manager,
	repo *repository.Repository,
	redisCache *cache.Redis,
) {

	// ---------------- CORS ----------------
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: false, // IMPORTANT: must be false when using "*"
		MaxAge:           int((12 * time.Hour).Seconds()),
	}))

	// ---------------- TEST ----------------
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "backend connected",
		})
	})

	// ---------------- AUTH ----------------
	auth := app.Group("/auth")
	auth.Post("/signup", authController.Signup)
	auth.Post("/verify", authController.VerifyOTP)
	auth.Post("/resend-otp", authController.ResendOTP)
	auth.Post("/login", authController.Login)
	auth.Post("/refresh", authController.Refresh)
	auth.Post("/logout", middleware.AuthMiddleware(jwtManager, redisCache), authController.Logout)

	// ---------------- USER (Protected) ----------------
	user := app.Group("/user", middleware.AuthMiddleware(jwtManager, redisCache))
	user.Get("/dashboard", authController.Dashboard)
}
