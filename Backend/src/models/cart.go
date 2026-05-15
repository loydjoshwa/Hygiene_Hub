package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Cart struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Relates to the user who owns this cart
	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_cart" json:"user_id"`

	// Belongs To relationship
	User User `gorm:"foreignKey:UserID" json:"-"`

	// Has Many relationship (A cart has many items)
	Items []CartItem `gorm:"foreignKey:CartID" json:"items,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

