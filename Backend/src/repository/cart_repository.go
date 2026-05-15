package repository

import (
	"hygienehub/src/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CartRepository interface defines the contract for our cart database operations
type CartRepository interface {
	GetOrCreateCart(userID string) (*models.Cart, error)
	GetCartWithItems(userID string) (*models.Cart, error)
	FindCartItem(cartID string, productID string) (*models.CartItem, error)
	FindItemByID(itemID string) (*models.CartItem, error)
	CreateCartItem(item *models.CartItem) error
	UpdateCartItem(item *models.CartItem) error
	RemoveCartItem(itemID string, cartID string) error
	ClearCart(cartID string) error
}

type cartRepository struct {
	db *gorm.DB
}

// NewCartRepository injects the database dependency and returns a CartRepository
func NewCartRepository(db *gorm.DB) CartRepository {
	return &cartRepository{db: db}
}

// GetOrCreateCart finds the user's cart. If it doesn't exist, it creates one.
func (r *cartRepository) GetOrCreateCart(userID string) (*models.Cart, error) {
	var cart models.Cart

	// Try to find the cart first
	err := r.db.Where("user_id = ?", userID).First(&cart).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Cart doesn't exist, so create a new one for this user
			cart = models.Cart{UserID: uuid.MustParse(userID)}
			if createErr := r.db.Create(&cart).Error; createErr != nil {
				return nil, createErr
			}
			return &cart, nil
		}
		return nil, err
	}

	return &cart, nil
}

// GetCartWithItems fetches the cart along with all its items and the associated products
func (r *cartRepository) GetCartWithItems(userID string) (*models.Cart, error) {
	var cart models.Cart
	// Preload the nested associations: Items, and Product inside Items
	err := r.db.Preload("Items").Preload("Items.Product").Where("user_id = ?", userID).First(&cart).Error
	return &cart, err
}

// FindCartItem checks if a specific product is already in a specific cart
func (r *cartRepository) FindCartItem(cartID string, productID string) (*models.CartItem, error) {
	var item models.CartItem
	err := r.db.Where("cart_id = ? AND product_id = ?", cartID, productID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// FindItemByID finds a cart item by its own primary key ID
func (r *cartRepository) FindItemByID(itemID string) (*models.CartItem, error) {
	var item models.CartItem
	err := r.db.Where("id = ?", itemID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// CreateCartItem adds a new item to the database
func (r *cartRepository) CreateCartItem(item *models.CartItem) error {
	return r.db.Create(item).Error
}

// UpdateCartItem saves changes to an existing cart item (like increasing quantity)
func (r *cartRepository) UpdateCartItem(item *models.CartItem) error {
	return r.db.Save(item).Error
}

// RemoveCartItem deletes a specific item from a cart
func (r *cartRepository) RemoveCartItem(itemID string, cartID string) error {
	// We check cartID as well to ensure the item belongs to the user's cart
	result := r.db.Where("id = ? AND cart_id = ?", itemID, cartID).Delete(&models.CartItem{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ClearCart deletes all items inside a specific cart
func (r *cartRepository) ClearCart(cartID string) error {
	return r.db.Where("cart_id = ?", cartID).Delete(&models.CartItem{}).Error
}
