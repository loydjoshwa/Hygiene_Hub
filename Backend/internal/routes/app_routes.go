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

	auth.Post("/signup", authController.Signup)
	auth.Post("/verify", authController.VerifyOTP)
	auth.Post("/resend-otp", authController.ResendOTP)
	auth.Post("/login", authController.Login)
	auth.Post("/refresh", authController.Refresh)
	auth.Post("/forgot-password", authController.ForgotPassword)
	auth.Post("/reset-password", authController.ResetPassword)

	auth.Post(
		"/logout",
		middleware.AuthMiddleware(jwtManager, redisCache),
		authController.Logout,
	)

	// ================= USER ROUTES =================
	user := app.Group(
		"/user",
		middleware.AuthMiddleware(jwtManager, redisCache),
	)

	user.Get("/dashboard", authController.Dashboard)

	// ================= ADMIN USER ROUTES =================
	adminUsers := app.Group(
		"/admin/users",
		middleware.AuthMiddleware(jwtManager, redisCache),
		middleware.AdminMiddleware(),
	)
	adminUsers.Get("/", userController.GetAllUsers)
	adminUsers.Patch("/:id/block", userController.BlockUser)
	adminUsers.Patch("/:id/unblock", userController.UnblockUser)

	// ================= PRODUCT ROUTES =================
	products := app.Group("/products")

	// Public Routes
	products.Get("/", productController.GetAll)
	products.Get("/:id", productController.GetByID)

	// Admin Routes
	adminProducts := products.Group(
		"/",
		middleware.AuthMiddleware(jwtManager, redisCache),
		middleware.AdminMiddleware(),
	)

	adminProducts.Post("/", productController.Create)
	adminProducts.Put("/:id", productController.Update)
	adminProducts.Delete("/:id", productController.Delete)

	// ================= CART ROUTES =================
	cart := app.Group(
		"/cart",
		middleware.AuthMiddleware(jwtManager, redisCache),
	)

	cart.Post("/", cartController.AddToCart)
	cart.Get("/", cartController.GetCart)
	cart.Put("/:id", cartController.UpdateCartQuantity)
	cart.Delete("/:id", cartController.RemoveFromCart)
	cart.Delete("/", cartController.ClearCart)

	// ================= WISHLIST ROUTES =================
	wishlist := app.Group(
		"/wishlist",
		middleware.AuthMiddleware(jwtManager, redisCache),
	)

	wishlist.Post("/", wishlistController.AddToWishlist)
	wishlist.Get("/", wishlistController.GetWishlist)
	wishlist.Delete("/:id", wishlistController.RemoveFromWishlist)

	// ================= IMAGE UPLOAD =================
	app.Post("/upload", uploadController.UploadImage)
}
