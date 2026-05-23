package main

import (
	"hygienehub/config"
	"hygienehub/internal/cache"
	"hygienehub/internal/routes"
	"hygienehub/migration"
	"hygienehub/src/controllers"
	"hygienehub/src/database"
	"hygienehub/src/repository"
	"hygienehub/src/services"
	"hygienehub/utils/email"
	"hygienehub/utils/jwt"
	"hygienehub/utils/logger"
	"hygienehub/utils/validation"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {

	// Load .env file
	err := godotenv.Load()

	if err != nil {
		log.Println(".env file not found")
	}

	// Load config
	cfg := config.LoadConfig()

	// Initialize logger
	logger.InitLogger()

	// Initialize validator
	validation.InitValidation()

	// Database setup
	db := database.SetupDatabase(cfg)

	// Run migrations
	migration.Migrate(db)

	// Repositories
	repo := repository.SetUpRepo(db)
	cartRepo := repository.NewCartRepository(db)

	// Redis
	redis := cache.NewRedis(cfg)

	// JWT
	jwtManager := jwt.NewJWTManager(cfg)

	// Email service
	emailService := email.NewEmailService(cfg)

	// Services
	authService := services.NewAuthService(
		repo,
		jwtManager,
		emailService,
		redis,
		cfg,
	)

	productService := services.NewProductService(repo)
	cartService := services.NewCartService(cartRepo, repo)
	wishlistService := services.NewWishlistService(repo)
	userService := services.NewUserService(repo, redis)
	adminService := services.NewAdminService(repo, redis)

	// Controllers
	authController := controllers.NewAuthController(authService)
	productController := controllers.NewProductController(productService)
	cartController := controllers.NewCartController(cartService)
	wishlistController := controllers.NewWishlistController(wishlistService, cartService)
	uploadController := controllers.NewUploadController()
	userController := controllers.NewUserController(userService)
	adminController := controllers.NewAdminController(adminService)
	orderController := controllers.NewOrderController(repo, db, cfg)

	// Fiber app
	app := fiber.New()

	// Setup routes
	routes.SetUpRoutes(
		app,
		authController,
		productController,
		cartController,
		wishlistController,
		uploadController,
		userController,
		adminController,
		orderController,
		jwtManager,
		redis,
	)

	logger.Log.Info("Server running on port ", cfg.Server.Port)

	// Start server
	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
