package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"` // added default gen_random_uuid to prevent insert errors

	Title       string    `gorm:"not null" json:"title"`
	Name        string    `gorm:"not null" json:"name"`
	CategoryID  uuid.UUID `gorm:"type:uuid;not null" json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Description string    `gorm:"type:text" json:"description"`

	Price int64 `gorm:"not null" json:"price"`


	Stock   int  `gorm:"default:0" json:"stock"`
	InStock bool `gorm:"default:true" json:"in_stock"`

	MainImage         string `json:"main_image"`
	MainImagePublicID string `json:"main_image_public_id"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
