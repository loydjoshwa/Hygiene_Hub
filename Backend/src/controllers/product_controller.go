package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type ProductController struct {
	productService *services.ProductService
}

func NewProductController(service *services.ProductService) *ProductController {
	return &ProductController{
		productService: service,
	}
}

// Create Product
func (p *ProductController) Create(c *fiber.Ctx) error {

	var req dto.CreateProductInput

	// Get form values
	req.Title = c.FormValue("title")
	req.Name = c.FormValue("name")
	req.Category = c.FormValue("category")
	req.Description = c.FormValue("description")

	// Convert price
	price, err := strconv.ParseInt(
		c.FormValue("price"),
		10,
		64,
	)

	if err != nil {
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{
				"error": "Invalid price",
			})
	}

	// Convert stock
	stock, err := strconv.Atoi(c.FormValue("stock"))

	if err != nil {
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{
				"error": "Invalid stock",
			})
	}

	req.Price = price
	req.Stock = stock

	// Get image
	file, err := c.FormFile("main_image")

	if err != nil {
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{
				"error": "main_image is required",
			})
	}

	req.MainImage = file

	// Create product
	product, err := p.productService.CreateProduct(&req)

	if err != nil {

		logger.Log.Error("Create Product failed:", err)

		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{
				"error": err.Error(),
			})
	}

	return c.Status(constant.CREATED).JSON(product)
}

// Get All Products + Search + Category Filter + Pagination
func (p *ProductController) GetAll(c *fiber.Ctx) error {

	// Get search query
	search := c.Query("search")

	// Get category query
	category := c.Query("category")

	// Check if pagination query params are present
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	if pageStr != "" || limitStr != "" {
		page := 1
		limit := 10

		if pageStr != "" {
			if pVal, err := strconv.Atoi(pageStr); err == nil && pVal > 0 {
				page = pVal
			}
		}
		if limitStr != "" {
			if lVal, err := strconv.Atoi(limitStr); err == nil && lVal > 0 {
				limit = lVal
			}
		}

		res, err := p.productService.GetAllProductsPaginated(
			search,
			category,
			page,
			limit,
		)

		if err != nil {
			logger.Log.Error("Get Paginated Products failed:", err)
			return c.Status(constant.INTERNALSERVERERROR).
				JSON(fiber.Map{
					"error": "Failed to retrieve products",
				})
		}
		return c.JSON(res)
	}

	products, err := p.productService.GetAllProducts(
		search,
		category,
	)

	if err != nil {

		logger.Log.Error("Get All Products failed:", err)

		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{
				"error": "Failed to retrieve products",
			})
	}

	return c.JSON(products)
}

// Get Product By ID
func (p *ProductController) GetByID(c *fiber.Ctx) error {

	id := c.Params("id")

	product, err := p.productService.GetProductByID(id)

	if err != nil {

		logger.Log.Warn("Product not found:", err)

		return c.Status(constant.NOTFOUND).
			JSON(fiber.Map{
				"error": "Product not found",
			})
	}

	return c.JSON(product)
}

// Update Product
func (p *ProductController) Update(c *fiber.Ctx) error {

	id := c.Params("id")

	var req dto.UpdateProductInput

	if !parseAndValidate(c, &req) {
		return nil
	}

	// Try to get form file for main_image (optional in update)
	file, err := c.FormFile("main_image")
	if err == nil {
		req.MainImage = file
	}

	product, err := p.productService.UpdateProduct(id, &req)

	if err != nil {

		logger.Log.Error("Update Product failed:", err)

		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{
				"error": "Failed to update product",
			})
	}

	return c.JSON(product)
}

// Delete Product
func (p *ProductController) Delete(c *fiber.Ctx) error {

	id := c.Params("id")

	err := p.productService.DeleteProduct(id)

	if err != nil {
		logger.Log.Error("Delete Product failed:", err)

		status := constant.INTERNALSERVERERROR
		if err.Error() == "product not found or already deleted" {
			status = constant.NOTFOUND
		}

		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Product deleted successfully",
	})
}