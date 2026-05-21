package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
)   

// CartService contains the business logic for cart operations
type CartService struct {
	cartRepo repository.CartRepository
	repo     repository.PgSQLRepository
}

// NewCartService creates a new CartService with the injected repositories
func NewCartService(cartRepo repository.CartRepository, repo repository.PgSQLRepository) *CartService {
	return &CartService{cartRepo: cartRepo, repo: repo}
}

// AddToCart adds a product to the user's cart or increases quantity if it exists
func (s *CartService) AddToCart(userID string, req *dto.AddToCartRequest) (*models.CartItem, error) {
	// 1. Validate ProductID
	productUUID, err := uuid.Parse(req.ProductID)
	if err != nil {
		return nil, errors.New("invalid product id")
	}

	// 2. Check if the product exists and get its price
	var product models.Product
	_, err = s.repo.FindByID(&product, productUUID)
	if err != nil {
		return nil, errors.New("product not found")
	}

	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than zero")
	}

	if !product.InStock || product.Stock <= 0 {
		return nil, errors.New("product is out of stock")
	}

	// 3. Get or create the user's cart
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return nil, errors.New("failed to get or create cart")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	// 4. Check if the product is already in the cart
	existingItem, err := s.cartRepo.FindCartItem(cart.ID.String(), req.ProductID)
	if err == nil {
		// Product already in cart, just increase the quantity
		newQuantity := existingItem.Quantity + req.Quantity
		if newQuantity > product.Stock {
			return nil, errors.New("requested quantity exceeds available stock")
		}
		existingItem.Quantity = newQuantity
		// Update price to current price (optional, but good for accuracy)
		existingItem.Price = product.Price
		if updateErr := s.cartRepo.UpdateCartItem(existingItem); updateErr != nil {
			log.Println("Database UpdateCartItem error:", updateErr)
			return nil, errors.New("failed to update cart item quantity: " + updateErr.Error())
		}
		existingItem.Product = product
		return existingItem, nil
	} else if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// 5. Product is not in cart, check if req.Quantity exceeds stock
	if req.Quantity > product.Stock {
		return nil, errors.New("requested quantity exceeds available stock")
	}

	// Create a new cart item
	newItem := &models.CartItem{
		ID:        uuid.New(),
		CartID:    cart.ID,
		UserID:    userUUID, // Set UserID directly from the parsed userID
		ProductID: productUUID,
		Quantity:  req.Quantity,
		Price:     product.Price, // Capture current price
	}

	if createErr := s.cartRepo.CreateCartItem(newItem); createErr != nil {
		log.Println("Database CreateCartItem error:", createErr)
		return nil, errors.New("failed to add item to cart: " + createErr.Error())
	}

	// Attach product details for the response
	newItem.Product = product

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
	if quantity <= 0 {
		return nil, errors.New("quantity must be greater than zero")
	}

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

	// Fetch the product to check stock
	var product models.Product
	_, err = s.repo.FindByID(&product, item.ProductID)
	if err != nil {
		return nil, errors.New("product not found")
	}

	if !product.InStock || product.Stock <= 0 {
		return nil, errors.New("product is out of stock")
	}

	if quantity > product.Stock {
		return nil, errors.New("requested quantity exceeds available stock")
	}

	// 4. Update the quantity and save
	item.Quantity = quantity
	if updateErr := s.cartRepo.UpdateCartItem(item); updateErr != nil {
		return nil, errors.New("failed to update cart item")
	}

	item.Product = product
	return item, nil
}

// RemoveFromCart removes an item from the user's cart
func (s *CartService) RemoveFromCart(userID string, itemID string) error {
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	return s.cartRepo.RemoveCartItem(itemID, cart.ID.String())
}

// ClearCart empties the user's cart completely
func (s *CartService) ClearCart(userID string) error {
	cart, err := s.cartRepo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	return s.cartRepo.ClearCart(cart.ID.String())
}
