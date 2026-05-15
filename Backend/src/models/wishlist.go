package models

import (
	"time"

	"github.com/google/uuid"
)

type Wishlist struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_product_wishlist" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_product_wishlist" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

