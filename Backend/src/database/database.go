package database

import (
	"fmt"
	"sync"
	"hygienehub/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var pgOnce sync.Once

func SetupDatabase(cfg *config.Config) (*gorm.DB) {
	var pgDB *gorm.DB
	pgOnce.Do(func()  {
		
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

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
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