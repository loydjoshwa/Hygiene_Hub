package routes

import (
	"time"

	"hygienehub/internal/cache"
	"hygienehub/middleware"
	"hygienehub/src/controllers"
	"hygienehub/utils/jwt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func SetUpRoutes(
	app *fiber.App,
	authController *controllers.AuthController,
	productController *controllers.ProductController,
	cartController *controllers.CartController,
	wishlistController *controllers.WishlistController,
	uploadController *controllers.UploadController,
	userController *controllers.UserController,
	adminController *controllers.AdminController,
	jwtManager *jwt.Manager,
	redisCache *cache.Redis,
) {

	// ================= CORS =================
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: false,
		MaxAge:           int((12 * time.Hour).Seconds()),
	}))

	// ================= TEST =================
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "backend connected",
		})
	})

	// ================= AUTH ROUTES =================
	auth := app.Group("/auth")
	{
		auth.Post("/signup", authController.Signup)
		auth.Post("/verify", authController.VerifyOTP)
		auth.Post("/resend-otp", authController.ResendOTP)
		auth.Post("/login", authController.Login)
		auth.Post("/refresh", authController.Refresh)
		auth.Post("/forgot-password", authController.ForgotPassword)
		auth.Post("/reset-password", authController.ResetPassword)

		// Protected Auth route
		auth.Post("/logout", middleware.AuthMiddleware(jwtManager, redisCache), authController.Logout)
	}

	// ================= USER ROUTES =================
	user := app.Group("/user")
	user.Use(middleware.AuthMiddleware(jwtManager, redisCache))
	{
		user.Get("/dashboard", authController.Dashboard)

		// Cart routes
		cart := user.Group("/cart")
		{
			cart.Get("/", cartController.GetCart)
			cart.Post("/", cartController.AddToCart)
			cart.Put("/:id", cartController.UpdateCartQuantity)
			cart.Delete("/:id", cartController.RemoveFromCart)
			cart.Delete("/", cartController.ClearCart)
		}

		// Wishlist routes
		wishlist := user.Group("/wishlist")
		{
			wishlist.Get("/", wishlistController.GetWishlist)
			wishlist.Post("/", wishlistController.AddToWishlist)
			wishlist.Delete("/:id", wishlistController.RemoveFromWishlist)
		}
	}

	// ================= PRODUCT ROUTES =================
	products := app.Group("/products")
	{
		products.Get("/", productController.GetAll)
		products.Get("/:id", productController.GetByID)
	}

	// ================= ADMIN ROUTES =================
	admin := app.Group("/admin")
	admin.Use(middleware.AuthMiddleware(jwtManager, redisCache))
	admin.Use(middleware.AdminMiddleware())
	{
		// Admin dashboard
		admin.Get("/stats", adminController.GetDashboardStats)

		// Admin product routes
		admin.Post("/products", productController.Create)
		admin.Put("/products/:id", productController.Update)
		admin.Delete("/products/:id", productController.Delete)

		// Admin user routes
		admin.Get("/users", userController.GetAllUsers)
		admin.Put("/users/:id", adminController.UpdateUser)
		admin.Patch("/users/:id/status", adminController.UpdateUserBlockStatus)
	}

	// ================= MISC ROUTES =================
	app.Post("/upload", uploadController.UploadImage)
}
