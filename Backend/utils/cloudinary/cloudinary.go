package cloudinary

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var cld *cloudinary.Cloudinary

func ConnectCloudinary() error {
	var err error

	// Try parsing from CLOUDINARY_URL
	url := os.Getenv("CLOUDINARY_URL")
	if url == "" {
		// Fallback to separate credentials if URL is not present
		cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
		apiKey := os.Getenv("CLOUDINARY_API_KEY")
		apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

		if cloudName == "" || apiKey == "" || apiSecret == "" {
			return fmt.Errorf("cloudinary credentials not found in environment variables")
		}
		cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	} else {
		cld, err = cloudinary.NewFromURL(url)
	}

	if err != nil {
		return err
	}

	cld.Config.URL.Secure = true
	return nil
}

// UploadImage uploads a file to Cloudinary and returns the secure URL
func UploadImage(file multipart.File, fileName string, folderName string) (string, error) {
	if cld == nil {
		return "", fmt.Errorf("cloudinary not initialized")
	}

	ctx := context.Background()
	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:   folderName,
		PublicID: fileName,
	})

	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}
