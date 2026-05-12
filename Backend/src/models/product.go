package models

import (
	"time"
)

type Product struct {
	ID          string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text;not null" json:"description"`
	Price       float64   `gorm:"type:numeric(10,2);not null" json:"price"`
	Rating      float64   `gorm:"type:numeric(3,2);default:0" json:"rating"`
	Image       string    `gorm:"type:text" json:"image"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
