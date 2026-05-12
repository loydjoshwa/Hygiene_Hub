package models

import "time"

// CartItem represents an individual product inside a cart
type CartItem struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CartID    string    `gorm:"type:uuid;not null;index" json:"cart_id"`
	ProductID string    `gorm:"type:uuid;not null" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"` // Preload product details
	Quantity  int       `gorm:"not null;default:1" json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
