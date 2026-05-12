package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
)

type ProductService struct {
	repo repository.PgSQLRepository
}

func NewProductService(repo repository.PgSQLRepository) *ProductService {
	return &ProductService{repo: repo}
}

// CreateProduct creates a new product in the database
func (s *ProductService) CreateProduct(req *dto.CreateProductRequest) (*models.Product, error) {
	product := &models.Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Rating:      req.Rating,
		Image:       req.Image,
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
func (s *ProductService) UpdateProduct(id string, req *dto.UpdateProductRequest) (*models.Product, error) {
	// First, check if product exists
	product, err := s.GetProductByID(id)
	if err != nil {
		return nil, err
	}

	// Prepare fields to update
	fieldsToUpdate := make(map[string]interface{})
	if req.Name != "" {
		fieldsToUpdate["name"] = req.Name
	}
	if req.Description != "" {
		fieldsToUpdate["description"] = req.Description
	}
	if req.Price > 0 {
		fieldsToUpdate["price"] = req.Price
	}
	if req.Rating >= 0 {
		fieldsToUpdate["rating"] = req.Rating
	}
	if req.Image != "" {
		fieldsToUpdate["image"] = req.Image
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
