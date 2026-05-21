package migration

import (
	"hygienehub/src/models"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	// 1. Auto-migrate Category first
	err := db.AutoMigrate(&models.Category{})
	if err != nil {
		log.Fatal("Category migration failed", err)
	}

	// 2. Check if we need to do the migration from old "category" string column to Category table
	if db.Migrator().HasTable("products") {
		if !db.Migrator().HasColumn(&models.Product{}, "category_id") {
			log.Println("Migrating old products category string column to separate table...")

			// Add category_id column as nullable initially
			err := db.Exec("ALTER TABLE products ADD COLUMN category_id UUID").Error
			if err != nil {
				log.Fatal("Failed to add category_id column:", err)
			}

			// Fetch all products
			type OldProduct struct {
				ID       uuid.UUID
				Category string
			}
			var oldProducts []OldProduct
			if err := db.Table("products").Select("id, category").Find(&oldProducts).Error; err == nil {
				for _, op := range oldProducts {
					if op.Category != "" {
						// Find or create category
						var category models.Category
						err := db.Where("LOWER(name) = LOWER(?)", op.Category).First(&category).Error
						if err != nil {
							if err == gorm.ErrRecordNotFound {
								category = models.Category{
									ID:   uuid.New(),
									Name: op.Category,
								}
								if createErr := db.Create(&category).Error; createErr != nil {
									log.Println("Failed to create category:", createErr)
									continue
								}
							} else {
								log.Println("Failed to query category:", err)
								continue
							}
						}
						// Update product category_id
						db.Table("products").Where("id = ?", op.ID).Update("category_id", category.ID)
					}
				}
			}

			// Setup default category just in case some entries don't have category string
			var defaultCategory models.Category
			err = db.Where("LOWER(name) = LOWER(?)", "general").First(&defaultCategory).Error
			if err != nil {
				if err == gorm.ErrRecordNotFound {
					defaultCategory = models.Category{
						ID:   uuid.New(),
						Name: "General",
					}
					db.Create(&defaultCategory)
				}
			}
			db.Table("products").Where("category_id IS NULL").Update("category_id", defaultCategory.ID)

			err = db.Exec("ALTER TABLE products ALTER COLUMN category_id SET NOT NULL").Error
			if err != nil {
				log.Fatal("Failed to alter category_id to NOT NULL:", err)
			}

			log.Println("Successfully migrated products to use category_id!")
		}
	}

	// 3. Run AutoMigrate for other models
	err = db.AutoMigrate(
		&models.User{},
		&models.RefreshToken{},
		&models.Product{},
		&models.Cart{},
		&models.CartItem{},
		&models.Wishlist{},
		&models.Order{},
		&models.OrderItem{},
	)

	if err != nil {
		log.Fatal("Migration failed", err)
	}
	log.Println("migration success")
}
