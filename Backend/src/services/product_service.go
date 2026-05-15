package services

import (
	"errors"
	"log"

	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/cloudinary"
)

type ProductService struct {
	repo repository.PgSQLRepository
}

func NewProductService(repo repository.PgSQLRepository) *ProductService {
	return &ProductService{
		repo: repo,
	}
}

// Create Product
func (s *ProductService) CreateProduct(
	req *dto.CreateProductInput,
) (*models.Product, error) {

	log.Println("CreateProduct function called")

	product := &models.Product{
		Title:       req.Title,
		Name:        req.Name,
		Category:    req.Category,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
	}

	// Set stock status
	if req.InStock != nil {
		product.InStock = *req.InStock
	} else {
		product.InStock = true
	}

	// Upload image
	if req.MainImage != nil {

		log.Println("Inside upload block")

		file, err := req.MainImage.Open()

		if err != nil {
			log.Println("File open error:", err)
			return nil, errors.New("failed to open image file")
		}

		defer file.Close()

		uploadResult, err := cloudinary.UploadImageFile(
			file,
			req.MainImage.Filename,
		)

		if err != nil {
			log.Println("Cloudinary upload error:", err)
			return nil, err
		}

		log.Println("Upload Success:", uploadResult.URL)

		product.MainImage = uploadResult.URL
		product.MainImagePublicID = uploadResult.PublicID
	}

	// Save product
	result, err := s.repo.Insert(product)

	if err != nil {
		log.Println("Database insert error:", err)
		return nil, err
	}

	createdProduct, ok := result.(*models.Product)

	if !ok {
		return nil, errors.New("failed to cast created product")
	}

	return createdProduct, nil
}

// Get All Products + Search
func (s *ProductService) GetAllProducts(
	search string,
) ([]*models.Product, error) {

	var products []*models.Product

	// Search products
	if search != "" {

		err := s.repo.GetDB().
			Where(
				"name ILIKE ? OR title ILIKE ? OR category ILIKE ?",
				"%"+search+"%",
				"%"+search+"%",
				"%"+search+"%",
			).
			Find(&products).Error

		if err != nil {
			return nil, err
		}

		return products, nil
	}

	// Get all products
	result, err := s.repo.FindAll(&products)

	if err != nil {
		return nil, err
	}

	foundProducts, ok := result.(*[]*models.Product)

	if !ok {
		return nil, errors.New("failed to cast products array")
	}

	return *foundProducts, nil
}

// Get Product By ID
func (s *ProductService) GetProductByID(
	id string,
) (*models.Product, error) {

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

// Update Product
func (s *ProductService) UpdateProduct(
	id string,
	req *dto.UpdateProductInput,
) (*models.Product, error) {

	product, err := s.GetProductByID(id)

	if err != nil {
		return nil, err
	}

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

	err = s.repo.UpdateByFields(
		product,
		id,
		fieldsToUpdate,
	)

	if err != nil {
		return nil, err
	}

	return s.GetProductByID(id)
}

// Delete Product
func (s *ProductService) DeleteProduct(id string) error {

	var product models.Product

	return s.repo.Delete(&product, id)
}