package models

import (
	"time"
)

type WishlistItem struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;not null" json:"user_id"`
	ProductID string    `gorm:"type:uuid;not null" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	CreatedAt time.Time `json:"created_at"`
}
