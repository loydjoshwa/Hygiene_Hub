package models

import (
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Relates to the Cart
	CartID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_cart_product" json:"cart_id"`

	// Relates to the User (added to match DB schema)
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Belongs To relationship
	Cart Cart `gorm:"foreignKey:CartID" json:"-"`

	// Relates to the Product
	ProductID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_cart_product" json:"product_id"`

	// Belongs To relationship
	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`

	// Quantity with database-level check constraint
	Quantity int `gorm:"not null;default:1;check:quantity > 0" json:"quantity"`

	// Captured price at the time of adding to cart
	Price int64 `gorm:"not null" json:"price"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

