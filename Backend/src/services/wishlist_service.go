package services

import (
	"errors"
	"hygienehub/src/dto"
	"hygienehub/src/models"
	"hygienehub/src/repository"

	"github.com/google/uuid"
)

type WishlistService struct {
	repo repository.PgSQLRepository
}

func NewWishlistService(repo repository.PgSQLRepository) *WishlistService {
	return &WishlistService{repo: repo}
}

func (s *WishlistService) AddToWishlist(userID string, req *dto.AddToWishlistRequest) (*models.Wishlist, error) {
	db := s.repo.GetDB()
	var existingItem models.Wishlist
	result := db.Where("user_id = ? AND product_id = ?", userID, req.ProductID.String()).First(&existingItem)
	if result.Error == nil {
		return nil, errors.New("product already in wishlist")
	}

	wishlistItem := &models.Wishlist{
		UserID:    uuid.MustParse(userID),
		ProductID: req.ProductID,
	}

	res, err := s.repo.Insert(wishlistItem)
	if err != nil {
		return nil, err
	}

	createdItem, ok := res.(*models.Wishlist)
	if !ok {
		return nil, errors.New("failed to cast created wishlist item")
	}

	db.Preload("Product").First(createdItem, "id = ?", createdItem.ID)

	return createdItem, nil
}

func (s *WishlistService) GetWishlist(userID string) ([]models.Wishlist, error) {
	var items []models.Wishlist
	db := s.repo.GetDB()
	if err := db.Preload("Product").Where("user_id = ?", userID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *WishlistService) RemoveFromWishlist(id string, userID string) error {
	db := s.repo.GetDB()
	result := db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Wishlist{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("wishlist item not found")
	}
	return nil
}
