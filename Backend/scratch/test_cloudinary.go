package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func main() {
	cld, err := cloudinary.NewFromParams("", "", "")
	if err != nil {
		fmt.Println("NewFromParams err:", err)
		return
	}
	fmt.Println("Client created")

	result, err := cld.Upload.Upload(
		context.Background(),
		strings.NewReader("dummy file content"),
		uploader.UploadParams{
			PublicID: "test",
		},
	)
	if err != nil {
		fmt.Println("Upload err:", err)
		return
	}
	fmt.Printf("Result URL: %s\n", result.SecureURL)
}
