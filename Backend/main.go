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
	"hygienehub/utils/cloudinary"
	"hygienehub/utils/email"
	"hygienehub/utils/jwt"
	"hygienehub/utils/logger"
	"hygienehub/utils/validation"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	cfg := config.LoadConfig()

	logger.InitLogger()

	validation.InitValidation()

	err := cloudinary.ConnectCloudinary()
	if err != nil {
		logger.Log.Warn("Failed to connect to Cloudinary: ", err)
	} else {
		logger.Log.Info("Successfully connected to Cloudinary")
	}

	db := database.SetupDatabase(cfg)

	migration.Migrate(db)

	repo := repository.SetUpRepo(db)
	cartRepo := repository.NewCartRepository(db)

	redis := cache.NewRedis(cfg)

	jwtManager := jwt.NewJWTManager(cfg)

	emailService := email.NewEmailService(cfg)

	authService := services.NewAuthService(repo, jwtManager, emailService, redis, cfg)
	productService := services.NewProductService(repo)
	cartService := services.NewCartService(cartRepo)
	wishlistService := services.NewWishlistService(repo)
	userService := services.NewUserService(repo, redis)

	authController := controllers.NewAuthController(authService)
	productController := controllers.NewProductController(productService)
	cartController := controllers.NewCartController(cartService)
	wishlistController := controllers.NewWishlistController(wishlistService)
	uploadController := controllers.NewUploadController()
	userController := controllers.NewUserController(userService)

	app := fiber.New()

	routes.SetUpRoutes(
		app,
		authController,
		productController,
		cartController,
		wishlistController,
		uploadController,
		userController,
		jwtManager,
		redis,
	)

	logger.Log.Info("Server running on port", cfg.Server.Port)

	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatal("server failed to start:", err)
	}
}
