package dto

type AddToWishlistRequest struct {
	ProductID string `json:"product_id" validate:"required"`
}
