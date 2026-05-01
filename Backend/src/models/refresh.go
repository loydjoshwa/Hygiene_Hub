package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RefreshToken struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID uuid.UUID `gorm:"type:uuid"`
	Token string `gorm:"type:text;not null"`
	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time 
	UpdatedAt time.Time 
	User  User `gorm:"foreignKey:UserID"`
}

func (r *RefreshToken) BeforeCreate(tx *gorm.DB) error{
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}