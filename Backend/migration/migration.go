package migration

import "gorm.io/gorm"

func Migrate(db *gorm.DB) {
  err:= db.AutoMigrate(
	
  )
}