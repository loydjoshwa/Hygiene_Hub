package models

import "time"

// Cart represents a user's shopping cart
// One user should have exactly one cart
type Cart struct {
	ID        string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    string     `gorm:"type:uuid;unique;not null" json:"user_id"` // unique ensures one cart per user
	CartItems []CartItem `gorm:"foreignKey:CartID;constraint:OnDelete:CASCADE;" json:"cart_items"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
