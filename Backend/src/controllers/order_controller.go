package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
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
	if err := oc.db.Preload("Items").Where("id = ?", id).First(&order).Error; err != nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order not found"})
	}

	oldStatus := order.Status
	newStatus := req.Status

	if oldStatus == newStatus {
		return c.JSON(order)
	}

	err := oc.db.Transaction(func(tx *gorm.DB) error {
		// Transition TO delivered: decrease stock
		if oldStatus != "delivered" && newStatus == "delivered" {
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
		}

		// Transition FROM delivered: increase stock
		if oldStatus == "delivered" && newStatus != "delivered" {
			for _, item := range order.Items {
				var product models.Product
				if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
					return err
				}

				product.Stock += item.Quantity
				product.InStock = true

				if err := tx.Save(&product).Error; err != nil {
					return err
				}
			}
		}

		// Refund coins if transitioning to cancelled
		if newStatus == "cancelled" {
			refundAmount := int64(0)
			isPaid := false
			if order.PaymentMethod == "cod" {
				if oldStatus == "delivered" {
					isPaid = true
				}
			} else {
				// Razorpay or Wallet payment is always paid immediately
				isPaid = true
			}

			if isPaid {
				refundAmount = order.Total
			} else {
				refundAmount = order.WalletAmountUsed
			}

			if refundAmount > 0 {
				var wallet models.Wallet
				if err := tx.Where("user_id = ?", order.UserID).First(&wallet).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						wallet = models.Wallet{
							ID:      uuid.New(),
							UserID:  order.UserID,
							Balance: 0,
						}
						if err := tx.Create(&wallet).Error; err != nil {
							return err
						}
					} else {
						return err
					}
				}
				wallet.Balance += refundAmount
				if err := tx.Save(&wallet).Error; err != nil {
					return err
				}
			}
		}

		order.Status = newStatus
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Failed to update status:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
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

	// Execute inside a database transaction to verify stock and save the order
	err = oc.db.Transaction(func(tx *gorm.DB) error {
		// Deduct from wallet if coins were applied
		if order.WalletAmountUsed > 0 {
			var wallet models.Wallet
			if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
				return fiber.NewError(constant.BADREQUEST, "Wallet not found")
			}
			if wallet.Balance < order.WalletAmountUsed {
				return fiber.NewError(constant.BADREQUEST, "Insufficient wallet balance")
			}
			wallet.Balance -= order.WalletAmountUsed
			if err := tx.Save(&wallet).Error; err != nil {
				return err
			}
		}

		for _, item := range order.Items {
			var product models.Product
			if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
				return err
			}

			if product.Stock < item.Quantity || !product.InStock {
				return fiber.NewError(constant.BADREQUEST, "product out of stock: "+product.Name)
			}
		}

		// Save/update user's delivery address
		var user models.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err == nil {
			var addr struct {
				Address string `json:"address"`
				State   string `json:"state"`
				Pincode string `json:"pincode"`
			}
			json.Unmarshal(order.ShippingAddress, &addr)

			user.Address = addr.Address
			user.State = addr.State
			user.Pincode = addr.Pincode
			user.Phone = order.UserPhone
			if err := tx.Save(&user).Error; err != nil {
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

func (oc *OrderController) CreateCODOrder(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req struct {
		OrderData models.Order `json:"client_order_details"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	order := req.OrderData
	order.ID = uuid.New()
	order.UserID = userID
	order.Status = "confirmed" // COD orders start as confirmed
	order.PaymentMethod = "cod"

	// Set payment details for COD
	paymentDetailsMap := map[string]interface{}{
		"status": "pending", // COD payments are pending until delivered
	}
	paymentDetailsJSON, err := json.Marshal(paymentDetailsMap)
	if err == nil {
		order.PaymentDetails = datatypes.JSON(paymentDetailsJSON)
	}

	for i := range order.Items {
		order.Items[i].ID = uuid.New()
	}

	// Database transaction for stock verification and order insertion
	err = oc.db.Transaction(func(tx *gorm.DB) error {
		// Deduct from wallet if coins were applied
		if order.WalletAmountUsed > 0 {
			var wallet models.Wallet
			if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
				return fiber.NewError(constant.BADREQUEST, "Wallet not found")
			}
			if wallet.Balance < order.WalletAmountUsed {
				return fiber.NewError(constant.BADREQUEST, "Insufficient wallet balance")
			}
			wallet.Balance -= order.WalletAmountUsed
			if err := tx.Save(&wallet).Error; err != nil {
				return err
			}
		}

		for _, item := range order.Items {
			var product models.Product
			if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
				return err
			}

			if product.Stock < item.Quantity || !product.InStock {
				return fiber.NewError(constant.BADREQUEST, "product out of stock: "+product.Name)
			}
		}

		// Save/update user's delivery address
		var user models.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err == nil {
			var addr struct {
				Address string `json:"address"`
				State   string `json:"state"`
				Pincode string `json:"pincode"`
			}
			json.Unmarshal(order.ShippingAddress, &addr)

			user.Address = addr.Address
			user.State = addr.State
			user.Pincode = addr.Pincode
			user.Phone = order.UserPhone
			if err := tx.Save(&user).Error; err != nil {
				return err
			}
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Create COD order failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":  "COD order created successfully",
		"order_id": order.ID,
	})
}

func (oc *OrderController) CancelUserOrder(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	id := c.Params("id")
	var order models.Order
	if err := oc.db.Preload("Items").Where("id = ? AND user_id = ?", id, userID).First(&order).Error; err != nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order not found"})
	}

	if order.Status == "cancelled" {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Order is already cancelled"})
	}

	oldStatus := order.Status
	order.Status = "cancelled"

	err := oc.db.Transaction(func(tx *gorm.DB) error {
		// If the order was delivered, restore the stock
		if oldStatus == "delivered" {
			for _, item := range order.Items {
				var product models.Product
				if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
					return err
				}

				product.Stock += item.Quantity
				product.InStock = true

				if err := tx.Save(&product).Error; err != nil {
					return err
				}
			}
		}

		// Refund coins on cancellation
		refundAmount := int64(0)
		isPaid := false
		if order.PaymentMethod == "cod" {
			if oldStatus == "delivered" {
				isPaid = true
			}
		} else {
			// Razorpay or Wallet payment is always paid immediately
			isPaid = true
		}

		if isPaid {
			refundAmount = order.Total
		} else {
			refundAmount = order.WalletAmountUsed
		}

		if refundAmount > 0 {
			var wallet models.Wallet
			if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					wallet = models.Wallet{
						ID:      uuid.New(),
						UserID:  userID,
						Balance: 0,
					}
					if err := tx.Create(&wallet).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			}
			wallet.Balance += refundAmount
			if err := tx.Save(&wallet).Error; err != nil {
				return err
			}
		}

		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Failed to cancel order:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to cancel order"})
	}

	return c.JSON(order)
}

func (oc *OrderController) GetUserWallet(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var wallet models.Wallet
	if err := oc.db.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Lazily create wallet
			wallet = models.Wallet{
				ID:      uuid.New(),
				UserID:  userID,
				Balance: 0,
			}
			if err := oc.db.Create(&wallet).Error; err != nil {
				return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to create wallet"})
			}
		} else {
			return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to fetch wallet"})
		}
	}

	return c.JSON(wallet)
}

func (oc *OrderController) ReturnOrderItem(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	orderID := c.Params("orderId")
	var req struct {
		OrderItemID string `json:"orderItemId"`
		Reason      string `json:"reason"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.OrderItemID == "" {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "orderItemId is required"})
	}

	// 1. Fetch order
	var order models.Order
	if err := oc.db.Preload("Items").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order not found"})
	}

	// 2. Returns only allowed for delivered orders
	if order.Status != "delivered" {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Returns are only allowed for delivered orders"})
	}

	// 3. Find matching item inside the preloaded items list
	var matchedItem *models.OrderItem
	for i := range order.Items {
		if order.Items[i].ID.String() == req.OrderItemID {
			matchedItem = &order.Items[i]
			break
		}
	}

	if matchedItem == nil {
		return c.Status(constant.NOTFOUND).JSON(fiber.Map{"error": "Order item not found"})
	}

	if matchedItem.IsReturned {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "This item has already been returned"})
	}

	// 4. Perform database transaction to mark returned, increase stock, and credit wallet
	err := oc.db.Transaction(func(tx *gorm.DB) error {
		// Mark item as returned
		matchedItem.IsReturned = true
		matchedItem.ReturnReason = req.Reason
		if err := tx.Save(matchedItem).Error; err != nil {
			return err
		}

		// Increment the product stock back (restore inventory)
		var product models.Product
		if err := tx.Where("id = ?", matchedItem.ProductID).First(&product).Error; err == nil {
			product.Stock += matchedItem.Quantity
			product.InStock = true
			if err := tx.Save(&product).Error; err != nil {
				return err
			}
		}

		// Credit User Wallet
		var wallet models.Wallet
		if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				wallet = models.Wallet{
					ID:      uuid.New(),
					UserID:  userID,
					Balance: 0,
				}
				if err := tx.Create(&wallet).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		refundAmount := matchedItem.Price * int64(matchedItem.Quantity)
		wallet.Balance += refundAmount
		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Return processing failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": "Failed to process return: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Product return processed successfully and refund credited to wallet",
		"refundAmount": matchedItem.Price * int64(matchedItem.Quantity),
	})
}

func (oc *OrderController) CreateWalletOrder(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(constant.UNAUTHORIZED).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req struct {
		OrderData models.Order `json:"client_order_details"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body"})
	}

	order := req.OrderData
	order.ID = uuid.New()
	order.UserID = userID
	order.Status = "confirmed" // Paid in full by wallet -> starts as confirmed
	order.PaymentMethod = "wallet"

	// Set payment details for Wallet payment
	paymentDetailsMap := map[string]interface{}{
		"status": "paid",
		"walletAmountUsed": order.Total,
	}
	paymentDetailsJSON, err := json.Marshal(paymentDetailsMap)
	if err == nil {
		order.PaymentDetails = datatypes.JSON(paymentDetailsJSON)
	}

	for i := range order.Items {
		order.Items[i].ID = uuid.New()
	}

	// Transaction for stock verification, wallet deduction and order creation
	err = oc.db.Transaction(func(tx *gorm.DB) error {
		// Deduct from wallet
		var wallet models.Wallet
		if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
			return fiber.NewError(constant.BADREQUEST, "Wallet not found")
		}
		if wallet.Balance < order.Total {
			return fiber.NewError(constant.BADREQUEST, "Insufficient wallet balance")
		}
		wallet.Balance -= order.Total
		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		// Verify Stock
		for _, item := range order.Items {
			var product models.Product
			if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
				return err
			}

			if product.Stock < item.Quantity || !product.InStock {
				return fiber.NewError(constant.BADREQUEST, "product out of stock: "+product.Name)
			}
		}

		// Save/update user's delivery address
		var user models.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err == nil {
			var addr struct {
				Address string `json:"address"`
				State   string `json:"state"`
				Pincode string `json:"pincode"`
			}
			json.Unmarshal(order.ShippingAddress, &addr)

			user.Address = addr.Address
			user.State = addr.State
			user.Pincode = addr.Pincode
			user.Phone = order.UserPhone
			if err := tx.Save(&user).Error; err != nil {
				return err
			}
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		logger.Log.Error("Create Wallet order failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":  "Wallet checkout completed successfully",
		"order_id": order.ID,
	})
}

