package controllers

import (
	"hygienehub/utils/cloudinary"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"

	"github.com/gofiber/fiber/v2"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

func (u *UploadController) UploadImage(c *fiber.Ctx) error {
	// Parse the multipart form
	fileHeader, err := c.FormFile("image")
	if err != nil {
		logger.Log.Error("Failed to get image from request:", err)
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{
			"error": "Image file is required",
		})
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		logger.Log.Error("Failed to open image file:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{
			"error": "Failed to process image file",
		})
	}
	defer file.Close()

	// Upload to Cloudinary
	folderName := "hygienehub_products" // You can make this dynamic if needed
	secureURL, err := cloudinary.UploadImage(file, fileHeader.Filename, folderName)
	if err != nil {
		logger.Log.Error("Failed to upload image to Cloudinary:", err)
		return c.Status(constant.INTERNALSERVERERROR).JSON(fiber.Map{
			"error": "Failed to upload image",
		})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Image uploaded successfully",
		"url":     secureURL,
	})
}
