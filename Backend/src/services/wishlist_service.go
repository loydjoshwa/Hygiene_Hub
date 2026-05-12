package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"
)

type WishlistService struct {
	repo repository.PgSQLRepository
}

func NewWishlistService(repo repository.PgSQLRepository) *WishlistService {
	return &WishlistService{repo: repo}
}

func (s *WishlistService) AddToWishlist(userID string, req *dto.AddToWishlistRequest) (*models.WishlistItem, error) {
	db := s.repo.GetDB()
	var existingItem models.WishlistItem
	result := db.Where("user_id = ? AND product_id = ?", userID, req.ProductID).First(&existingItem)
	if result.Error == nil {
		return nil, errors.New("product already in wishlist")
	}

	wishlistItem := &models.WishlistItem{
		UserID:    userID,
		ProductID: req.ProductID,
	}

	res, err := s.repo.Insert(wishlistItem)
	if err != nil {
		return nil, err
	}

	createdItem, ok := res.(*models.WishlistItem)
	if !ok {
		return nil, errors.New("failed to cast created wishlist item")
	}

	db.Preload("Product").First(createdItem, "id = ?", createdItem.ID)

	return createdItem, nil
}

func (s *WishlistService) GetWishlist(userID string) ([]models.WishlistItem, error) {
	var items []models.WishlistItem
	db := s.repo.GetDB()
	if err := db.Preload("Product").Where("user_id = ?", userID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *WishlistService) RemoveFromWishlist(id string, userID string) error {
	db := s.repo.GetDB()
	result := db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.WishlistItem{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("wishlist item not found")
	}
	return nil
}
