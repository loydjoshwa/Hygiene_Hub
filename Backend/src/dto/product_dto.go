package dto

import "mime/multipart"

type CreateProductInput struct {
	Title       string                `form:"title" validate:"required,min=2"`
	Name        string                `form:"name" validate:"required,min=2,max=100"`
	Category    string                `form:"category" validate:"required"`
	Description string                `form:"description" validate:"required,min=5,max=100"`
	Price       int64                 `form:"price" validate:"required,gt=0"`
	Stock       int                   `form:"stock" validate:"required,gte=0"`
	InStock     *bool                 `form:"in_stock"`
	MainImage   *multipart.FileHeader `form:"main_image"`
}

type UpdateProductInput struct {
	Title       *string                `form:"title" validate:"omitempty,min=2"`
	Name        *string                `form:"name" validate:"omitempty,min=2"`
	Category    *string                `form:"category" validate:"omitempty"`
	Description *string                `form:"description" validate:"omitempty,min=5"`
	Price       *int64                 `form:"price" validate:"omitempty,gt=0"`
	Stock       *int                   `form:"stock" validate:"omitempty,gte=0"`
	InStock     *bool                  `form:"in_stock"`
	MainImage   *multipart.FileHeader `form:"main_image"`
}

