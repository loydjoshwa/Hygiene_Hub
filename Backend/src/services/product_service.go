package services

import (
	"errors"
	"log"

	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/cloudinary"

	"github.com/google/uuid"
	"gorm.io/gorm"
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

	// Find or create category
	var category models.Category
	err := s.repo.GetDB().Where("LOWER(name) = LOWER(?)", req.Category).First(&category).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			category = models.Category{
				ID:   uuid.New(),
				Name: req.Category,
			}
			if createErr := s.repo.GetDB().Create(&category).Error; createErr != nil {
				return nil, createErr
			}
		} else {
			return nil, err
		}
	}

	product := &models.Product{
		Title:       req.Title,
		Name:        req.Name,
		CategoryID:  category.ID,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
	}

	// Set stock status
	if req.InStock != nil {
		product.InStock = *req.InStock
	} else {
		product.InStock = req.Stock > 0
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

	// Preload Category association for returned product
	var loadedProduct models.Product
	if err := s.repo.GetDB().Preload("Category").First(&loadedProduct, "id = ?", createdProduct.ID).Error; err == nil {
		return &loadedProduct, nil
	}

	return createdProduct, nil
}

type PaginatedProductsResponse struct {
	Products   []*models.Product `json:"products"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

// GetAllProductsPaginated returns paginated product list
func (s *ProductService) GetAllProductsPaginated(
	search string,
	category string,
	page int,
	limit int,
) (*PaginatedProductsResponse, error) {
	var products []*models.Product
	var total int64

	// Base queries
	query := s.repo.GetDB().Model(&models.Product{})
	countQuery := s.repo.GetDB().Model(&models.Product{})

	// Search filter
	if search != "" {
		filter := "products.name ILIKE ? OR products.title ILIKE ?"
		query = query.Where(filter, "%"+search+"%", "%"+search+"%")
		countQuery = countQuery.Where(filter, "%"+search+"%", "%"+search+"%")
	}

	// Category filter
	if category != "" {
		joinSQL := "JOIN categories ON categories.id = products.category_id"
		filter := "categories.name ILIKE ?"
		query = query.Joins(joinSQL).Where(filter, "%"+category+"%").Select("products.*")
		countQuery = countQuery.Joins(joinSQL).Where(filter, "%"+category+"%")
	}

	// Count total matching items
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// Offset and limit
	offset := (page - 1) * limit
	err := query.Preload("Category").Offset(offset).Limit(limit).Find(&products).Error
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 0 {
		totalPages = 0
	}

	return &PaginatedProductsResponse{
		Products:   products,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// Get All Products + Search + Category Filter
func (s *ProductService) GetAllProducts(
	search string,
	category string,
) ([]*models.Product, error) {

	var products []*models.Product

	// Start query
	query := s.repo.GetDB().Model(&models.Product{}).Preload("Category")

	// Search filter
	if search != "" {

		query = query.Where(
			"products.name ILIKE ? OR products.title ILIKE ?",
			"%"+search+"%",
			"%"+search+"%",
		)
	}

	// Category filter
	if category != "" {
		query = query.Joins("JOIN categories ON categories.id = products.category_id").
			Where("categories.name ILIKE ?", "%"+category+"%").
			Select("products.*")
	}

	// Execute query
	err := query.Find(&products).Error

	if err != nil {
		return nil, err
	}

	return products, nil
}

// Get Product By ID
func (s *ProductService) GetProductByID(
	id string,
) (*models.Product, error) {

	var product models.Product

	err := s.repo.GetDB().Preload("Category").First(&product, "id = ?", id).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
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
		var category models.Category
		err := s.repo.GetDB().Where("LOWER(name) = LOWER(?)", *req.Category).First(&category).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				category = models.Category{
					ID:   uuid.New(),
					Name: *req.Category,
				}
				if createErr := s.repo.GetDB().Create(&category).Error; createErr != nil {
					return nil, createErr
				}
			} else {
				return nil, err
			}
		}
		fieldsToUpdate["category_id"] = category.ID
	}

	if req.Description != nil {
		fieldsToUpdate["description"] = *req.Description
	}

	if req.Price != nil {
		fieldsToUpdate["price"] = *req.Price
	}

	if req.Stock != nil {
		fieldsToUpdate["stock"] = *req.Stock
		if req.InStock == nil {
			fieldsToUpdate["in_stock"] = *req.Stock > 0
		}
	}

	if req.InStock != nil {
		fieldsToUpdate["in_stock"] = *req.InStock
	}

	// Upload new image if provided
	if req.MainImage != nil {
		file, err := req.MainImage.Open()
		if err != nil {
			return nil, errors.New("failed to open image file")
		}
		defer file.Close()

		uploadResult, err := cloudinary.UploadImageFile(
			file,
			req.MainImage.Filename,
		)
		if err != nil {
			return nil, err
		}

		fieldsToUpdate["main_image"] = uploadResult.URL
		fieldsToUpdate["main_image_public_id"] = uploadResult.PublicID
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
	// Check if product exists
	_, err := s.repo.FindByID(&product, id)
	if err != nil {
		return errors.New("product not found")
	}

	return s.repo.Delete(&product, id)
}
