package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

type ProductController struct {
	productService *services.ProductService
}

func NewProductController(service *services.ProductService) *ProductController {
	return &ProductController{productService: service}
}

// Create a new product
func (p *ProductController) Create(c *fiber.Ctx) error {
	var req dto.CreateProductInput

	if err := parseAndValidate(c, &req); err != nil {
		return err // error response is handled inside parseAndValidate
	}

	// Manually handle the file upload
	file, err := c.FormFile("main_image")
	if err == nil {
		req.MainImage = file
	}

	product, err := p.productService.CreateProduct(&req)
	if err != nil {
		logger.Log.Error("Create Product failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to create product"})
	}

	return c.Status(constant.CREATED).JSON(product)
}

// GetAll retrieves all products
func (p *ProductController) GetAll(c *fiber.Ctx) error {
	products, err := p.productService.GetAllProducts()
	if err != nil {
		logger.Log.Error("Get All Products failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to retrieve products"})
	}

	return c.JSON(products)
}

// GetByID retrieves a single product
func (p *ProductController) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	product, err := p.productService.GetProductByID(id)
	if err != nil {
		logger.Log.Warn("Product not found:", err)
		return c.Status(constant.NOTFOUND).
			JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(product)
}

// Update modifies an existing product
func (p *ProductController) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateProductInput

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	product, err := p.productService.UpdateProduct(id, &req)
	if err != nil {
		logger.Log.Error("Update Product failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to update product"})
	}

	return c.JSON(product)
}

// Delete removes a product
func (p *ProductController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := p.productService.DeleteProduct(id)
	if err != nil {
		logger.Log.Error("Delete Product failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to delete product"})
	}

	return c.JSON(fiber.Map{
		"message": "Product deleted successfully",
	})
}
