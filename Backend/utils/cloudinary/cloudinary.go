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

func UploadImageFile(file multipart.File, filename string) (*CloudinaryResult, error) {
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		return nil, err
	}

	// Use secure https URLs
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
		return nil, err
	}

	return &CloudinaryResult{
		URL:      result.SecureURL,
		PublicID: result.PublicID,
	}, nil
}
