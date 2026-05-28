package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Order struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	OrderID         string         `gorm:"type:varchar(50);uniqueIndex" json:"orderId"`
	UserID          string         `gorm:"type:varchar(50);not null;index" json:"userId"`
	UserName        string         `json:"userName"`
	UserEmail        string         `json:"userEmail"`
	UserPhone        string         `json:"userPhone"`
	ShippingAddress  datatypes.JSON `json:"shippingAddress"`
	PaymentMethod    string         `json:"paymentMethod"`
	PaymentDetails   datatypes.JSON `json:"paymentDetails"`
	Subtotal         int64          `json:"subtotal"`
	Shipping         int64          `json:"shipping"`
	Total            int64          `json:"total"`
	WalletAmountUsed int64          `gorm:"default:0" json:"walletAmountUsed"`
	Status           string         `json:"status"`
	OrderDate        time.Time      `json:"orderDate"`
	Items            []OrderItem    `gorm:"foreignKey:OrderIDRef" json:"items"`
}

type OrderItem struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	OrderIDRef   uuid.UUID `gorm:"type:uuid;not null;index" json:"-"`
	ProductID    string    `gorm:"type:varchar(50);not null" json:"productId"`
	Name         string    `json:"name"`
	Price        int64     `json:"price"`
	Quantity     int       `json:"quantity"`
	Image        string    `json:"image"`
	IsReturned   bool      `gorm:"default:false" json:"isReturned"`
	ReturnReason string    `gorm:"type:text" json:"returnReason"`
}
