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
	
)

func main() {
	cfg := config.LoadConfig()

	logger.InitLogger()

	validation.InitValidation()

	db:=database.SetupDatabase(cfg)

	migration.Migrate(db)

	repo:=repository.SetUpRepo(db)

	redis:=cache.NewRedis()

	jwtManager:=jwt.NewJWTManager(cfg)

	emailService:=email.NewEmailService(cfg)

	authService:=services.NewAuthService(repo,jwtManager,emailService,redis,cfg)
    

	authController:=controllers.NewAuthController(authService)

	app:=fiber.New()

	routes.SetUpRoutes(
		app,
		authController,
		jwtManager,
		repo,
	)

	logger.Log.Info("Server running on port", cfg.Server.Port)

	if err:=app.Listen(":"+cfg.Server.Port);err!=nil{
		log.Fatal("server failed to start:",err)
	}
}