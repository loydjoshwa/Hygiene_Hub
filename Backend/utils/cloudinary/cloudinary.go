package cloudinary

import (
	"context"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryResult struct {
	URL      string
	PublicID string
}

func UploadImageFile(
	file multipart.File,
	filename string,
) (*CloudinaryResult, error) {

	// Debug environment variables
	println("Cloud Name:", os.Getenv("CLOUDINARY_CLOUD_NAME"))
	println("API Key:", os.Getenv("CLOUDINARY_API_KEY"))
	println("API Secret:", os.Getenv("CLOUDINARY_API_SECRET"))

	// Create Cloudinary instance
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)

	if err != nil {
		return nil, err
	}

	// Secure HTTPS URL
	cld.Config.URL.Secure = true

	// Upload image
	result, err := cld.Upload.Upload(
		context.Background(),
		file,
		uploader.UploadParams{
			PublicID: filename,
		},
	)

	if err != nil {
		println("UPLOAD ERROR:", err.Error())
		return nil, err
	}

	// Debug upload response
	println("UPLOAD URL:", result.URL)
	println("UPLOAD SECURE URL:", result.SecureURL)
	println("PUBLIC ID:", result.PublicID)

	return &CloudinaryResult{
		URL:      result.URL,
		PublicID: result.PublicID,
	}, nil
}
