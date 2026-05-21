package database

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"hygienehub/src/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var pgOnce sync.Once

func SetupDatabase(cfg *models.Config) *gorm.DB {
	var pgDB *gorm.DB
	pgOnce.Do(func() {

		dsn := fmt.Sprintf(

			"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=%s",
			cfg.DB.Host,
			cfg.DB.User,
			cfg.DB.Password,
			cfg.DB.Name,
			cfg.DB.Port,
			cfg.DB.SSLMode,
			cfg.DB.TimeZone,
		)

		newLogger := gormlogger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
			gormlogger.Config{
				SlowThreshold:             time.Second,     // Slow SQL threshold (1s)
				LogLevel:                  gormlogger.Warn, // Log level
				IgnoreRecordNotFoundError: true,            // Ignore ErrRecordNotFound error for logger
				Colorful:                  true,            // Disable color
			},
		)

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: newLogger,
		})
		if err != nil {
			panic("failed to connect database: " + err.Error())
		}

		sqlDB, err := db.DB()
		if err != nil {
			panic("failed to connect database: " + err.Error())
		}

		sqlDB.SetMaxIdleConns(2)
		sqlDB.SetMaxOpenConns(10)

		pgDB = db
	})
	return pgDB
}
