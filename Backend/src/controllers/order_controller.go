package controllers

import (
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderController struct {
	repo repository.PgSQLRepository
	db   *gorm.DB
}

func NewOrderController(repo repository.PgSQLRepository, db *gorm.DB) *OrderController {
	return &OrderController{
		repo: repo,
		db:   db,
	}
}

func (oc *OrderController) CreateOrder(c *fiber.Ctx) error {
	// Parse user_id
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var order models.Order
	if err := c.BodyParser(&order); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	order.ID = uuid.New()
	order.UserID = userID

	for i := range order.Items {
		order.Items[i].ID = uuid.New()
	}

	// Use a transaction to reduce stock and save order
	err := oc.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range order.Items {
			var product models.Product
			if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
				return err
			}
			
			if product.Stock < item.Quantity || !product.InStock {
				return fiber.NewError(constant.BADREQUEST, "product out of stock: "+product.Name)
			}
			
			product.Stock -= item.Quantity
			if product.Stock == 0 {
				product.InStock = false
			}
			
			if err := tx.Save(&product).Error; err != nil {
				return err
			}
		}

		// Save the order
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Create order failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.CREATED).JSON(order)
}

func (oc *OrderController) GetUserOrders(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var orders []models.Order
	if err := oc.db.Preload("Items").Where("user_id = ?", userID).Find(&orders).Error; err != nil {
		logger.Log.Error("Failed to fetch orders:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}

	return c.JSON(orders)
}

func (oc *OrderController) GetAllOrders(c *fiber.Ctx) error {
	var orders []models.Order
	if err := oc.db.Preload("Items").Find(&orders).Error; err != nil {
		logger.Log.Error("Failed to fetch all orders:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}
	return c.JSON(orders)
}

func (oc *OrderController) GetOrderByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := oc.db.Preload("Items").Where("id = ?", id).First(&order).Error; err != nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order not found"})
	}
	return c.JSON(order)
}

func (oc *OrderController) UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var order models.Order
	if err := oc.db.Where("id = ?", id).First(&order).Error; err != nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order not found"})
	}

	order.Status = req.Status
	if err := oc.db.Save(&order).Error; err != nil {
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to update status"})
	}

	return c.JSON(order)
}
