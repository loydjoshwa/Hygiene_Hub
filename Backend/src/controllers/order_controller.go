package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/razorpay/razorpay-go"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type OrderController struct {
	repo repository.PgSQLRepository
	db   *gorm.DB
	cfg  *models.Config
}

func NewOrderController(repo repository.PgSQLRepository, db *gorm.DB, cfg *models.Config) *OrderController {
	return &OrderController{
		repo: repo,
		db:   db,
		cfg:  cfg,
	}
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

func (oc *OrderController) CreateRazorpayOrder(c *fiber.Ctx) error {
	var req struct {
		Amount int64 `json:"amount"` // in rupees
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Amount <= 0 {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Amount must be greater than zero"})
	}

	// Initialize Razorpay Client
	client := razorpay.NewClient(oc.cfg.Razorpay.KeyID, oc.cfg.Razorpay.KeySecret)

	data := map[string]interface{}{
		"amount":   req.Amount * 100, // Razorpay expects amount in paise
		"currency": "INR",
		"receipt":  uuid.New().String(),
	}

	body, err := client.Order.Create(data, nil)
	if err != nil {
		logger.Log.Error("Razorpay order creation failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to create payment order"})
	}

	// Extract the razorpay order id
	orderID, ok := body["id"].(string)
	if !ok {
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to parse payment order ID"})
	}

	return c.JSON(fiber.Map{
		"razorpay_order_id": orderID,
		"amount":            req.Amount * 100, // paise
		"key_id":            oc.cfg.Razorpay.KeyID,
	})
}

func (oc *OrderController) VerifyRazorpayPayment(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req struct {
		RazorpayOrderID   string       `json:"razorpay_order_id"`
		RazorpayPaymentID string       `json:"razorpay_payment_id"`
		RazorpaySignature string       `json:"razorpay_signature"`
		OrderData         models.Order `json:"client_order_details"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 1. Verify Razorpay Signature locally
	// Signature format is: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
	data := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	h := hmac.New(sha256.New, []byte(oc.cfg.Razorpay.KeySecret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if !hmac.Equal([]byte(expectedSignature), []byte(req.RazorpaySignature)) {
		logger.Log.Warn("Razorpay signature verification failed!")
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid payment signature"})
	}

	// 2. Signature is valid! Now create the actual order in the DB and adjust inventory
	order := req.OrderData
	order.ID = uuid.New()
	order.UserID = userID
	order.Status = "processing" // Set to processing upon successful payment

	// Update Payment Details with Razorpay transaction info
	paymentDetailsMap := map[string]interface{}{
		"razorpayOrderId":   req.RazorpayOrderID,
		"razorpayPaymentId": req.RazorpayPaymentID,
		"razorpaySignature": req.RazorpaySignature,
		"status":            "paid",
	}
	paymentDetailsJSON, err := json.Marshal(paymentDetailsMap)
	if err == nil {
		order.PaymentDetails = datatypes.JSON(paymentDetailsJSON)
	}

	for i := range order.Items {
		order.Items[i].ID = uuid.New()
	}

	// Execute inside a database transaction to adjust stock and save the order
	err = oc.db.Transaction(func(tx *gorm.DB) error {
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

		// Save the order in DB
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Create order from payment failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":  "Payment verified and order created successfully",
		"order_id": order.ID,
	})
}

