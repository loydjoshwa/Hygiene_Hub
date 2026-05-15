package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/cloudinary"
)

type ProductService struct {
	repo repository.PgSQLRepository
}

func NewProductService(repo repository.PgSQLRepository) *ProductService {
	return &ProductService{repo: repo}
}

// CreateProduct creates a new product in the database
func (s *ProductService) CreateProduct(req *dto.CreateProductInput) (*models.Product, error) {
	product := &models.Product{
		Title:       req.Title,
		Name:        req.Name,
		Category:    req.Category,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
	}

	if req.InStock != nil {
		product.InStock = *req.InStock
	} else {
		product.InStock = true // Default value
	}

	if req.MainImage != nil {
		file, err := req.MainImage.Open()
		if err != nil {
			return nil, errors.New("failed to open image file")
		}
		defer file.Close()

		uploadResult, err := cloudinary.UploadImageFile(file, req.MainImage.Filename)
		if err != nil {
			return nil, errors.New("failed to upload image to cloudinary")
		}
		product.MainImage = uploadResult.URL
		product.MainImagePublicID = uploadResult.PublicID
	}

	result, err := s.repo.Insert(product)
	if err != nil {
		return nil, err
	}

	createdProduct, ok := result.(*models.Product)
	if !ok {
		return nil, errors.New("failed to cast created product")
	}

	return createdProduct, nil
}

// GetAllProducts retrieves all products
func (s *ProductService) GetAllProducts() ([]*models.Product, error) {
	var products []*models.Product
	result, err := s.repo.FindAll(&products)
	if err != nil {
		return nil, err
	}

	// Assuming FindAll returns the pointer to the slice
	foundProducts, ok := result.(*[]*models.Product)
	if !ok {
		return nil, errors.New("failed to cast products array")
	}

	return *foundProducts, nil
}

// GetProductByID retrieves a product by its ID
func (s *ProductService) GetProductByID(id string) (*models.Product, error) {
	var product models.Product
	result, err := s.repo.FindByID(&product, id)
	if err != nil {
		return nil, err
	}

	foundProduct, ok := result.(*models.Product)
	if !ok {
		return nil, errors.New("product not found")
	}

	return foundProduct, nil
}

// UpdateProduct updates an existing product
func (s *ProductService) UpdateProduct(id string, req *dto.UpdateProductInput) (*models.Product, error) {
	// First, check if product exists
	product, err := s.GetProductByID(id)
	if err != nil {
		return nil, err
	}

	// Prepare fields to update
	fieldsToUpdate := make(map[string]interface{})
	if req.Title != nil {
		fieldsToUpdate["title"] = *req.Title
	}
	if req.Name != nil {
		fieldsToUpdate["name"] = *req.Name
	}
	if req.Category != nil {
		fieldsToUpdate["category"] = *req.Category
	}
	if req.Description != nil {
		fieldsToUpdate["description"] = *req.Description
	}
	if req.Price != nil {
		fieldsToUpdate["price"] = *req.Price
	}
	if req.Stock != nil {
		fieldsToUpdate["stock"] = *req.Stock
	}
	if req.InStock != nil {
		fieldsToUpdate["in_stock"] = *req.InStock
	}

	// Update the database
	err = s.repo.UpdateByFields(product, id, fieldsToUpdate)
	if err != nil {
		return nil, err
	}

	// Fetch updated product to return
	return s.GetProductByID(id)
}

// DeleteProduct deletes a product by ID
func (s *ProductService) DeleteProduct(id string) error {
	var product models.Product
	// Using the ID, the Delete method typically requires the model pointer and ID
	err := s.repo.Delete(&product, id)
	return err
}
