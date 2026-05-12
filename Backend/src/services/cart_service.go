package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"

	"gorm.io/gorm"
)

// CartService contains the business logic for cart operations
type CartService struct {
	cartRepo repository.CartRepository
}

// NewCartService creates a new CartService with the injected repository
func NewCartService(cartRepo repository.CartRepository) *CartService {
	return &CartService{cartRepo: cartRepo}
}

// AddToCart adds a product to the user's cart or increases quantity if it exists
func (s *CartService) AddToCart(userID string, req *dto.AddToCartRequest) (*models.CartItem, error) {
	// 1. Get or create the user's cart
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return nil, errors.New("failed to get or create cart")
	}

	// 2. Check if the product is already in the cart
	existingItem, err := s.cartRepo.FindCartItem(cart.ID, req.ProductID)
	if err == nil {
		// Product already in cart, just increase the quantity
		existingItem.Quantity += req.Quantity
		if updateErr := s.cartRepo.UpdateCartItem(existingItem); updateErr != nil {
			return nil, errors.New("failed to update cart item quantity")
		}
		return existingItem, nil
	} else if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// 3. Product is not in cart, create a new cart item
	newItem := &models.CartItem{
		CartID:    cart.ID,
		ProductID: req.ProductID,
		Quantity:  req.Quantity,
	}

	if createErr := s.cartRepo.CreateCartItem(newItem); createErr != nil {
		return nil, errors.New("failed to add item to cart")
	}

	return newItem, nil
}

// GetCart retrieves the user's cart and all its items
func (s *CartService) GetCart(userID string) (*models.Cart, error) {
	// First ensure they have a cart
	_, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return nil, err
	}

	// Fetch the cart with all items and products included
	cart, err := s.cartRepo.GetCartWithItems(userID)
	if err != nil {
		return nil, errors.New("failed to fetch cart items")
	}

	return cart, nil
}

// UpdateCartQuantity directly sets the quantity of a specific cart item
func (s *CartService) UpdateCartQuantity(userID string, itemID string, quantity int) (*models.CartItem, error) {
	// 1. Get the user's cart
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return nil, errors.New("failed to get cart")
	}

	// 2. Find the cart item
	item, err := s.cartRepo.FindItemByID(itemID)
	if err != nil {
		return nil, errors.New("cart item not found")
	}

	// 3. Ensure this item actually belongs to this user's cart
	if item.CartID != cart.ID {
		return nil, errors.New("unauthorized to update this cart item")
	}

	// 4. Update the quantity and save
	item.Quantity = quantity
	if updateErr := s.cartRepo.UpdateCartItem(item); updateErr != nil {
		return nil, errors.New("failed to update cart item")
	}

	return item, nil
}

// RemoveFromCart removes an item from the user's cart
func (s *CartService) RemoveFromCart(userID string, itemID string) error {
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	return s.cartRepo.RemoveCartItem(itemID, cart.ID)
}

// ClearCart empties the user's cart completely
func (s *CartService) ClearCart(userID string) error {
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	return s.cartRepo.ClearCart(cart.ID)
}
