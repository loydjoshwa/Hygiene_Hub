package dto

import "github.com/google/uuid"

type AddToWishlistRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
}
