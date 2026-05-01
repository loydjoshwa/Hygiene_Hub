package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
    ID         uuid.UUID      `gorm:"type:uuid;primaryKey"`
    Name       string         `gorm:"not null"`
    Email      string         `gorm:"unique;not null"`
    Password   string         `gorm:"not null"`
    Role       string         `gorm:"not null"`
    IsBlocked  bool           `gorm:"default:false"`
    IsVerified bool           `gorm:"default:false"`
    CreatedAt  time.Time
    UpdatedAt  time.Time
    DeletedAt  gorm.DeletedAt `gorm:"index"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
