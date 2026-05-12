package dto

type CreateProductRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description" validate:"required"`
	Price       float64 `json:"price" validate:"required,gt=0"`
	Rating      float64 `json:"rating"`
	Image       string  `json:"image" validate:"required"`
}

type UpdateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price" validate:"omitempty,gt=0"`
	Rating      float64 `json:"rating"`
	Image       string  `json:"image"`
}
