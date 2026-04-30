package validation

import (
	"fmt"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var (
	validate  = validator.New()
	nameRegex = regexp.MustCompile(`^[a-zA-Z\s]{3,}$`)
)

// 🔹 Initialize custom validations
func InitValidation() {
	validate.RegisterValidation("name", validateName)
	validate.RegisterValidation("password", validatePassword)
}

// 🔹 Name validation (min 3 letters, letters + spaces)
func validateName(fl validator.FieldLevel) bool {
	return nameRegex.MatchString(fl.Field().String())
}

// 🔹 Password validation
func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	if len(password) < 6 || len(password) > 20 {
		return false
	}

	var hasUpper, hasLower bool

	for _, ch := range password {
		switch {
		case 'A' <= ch && ch <= 'Z':
			hasUpper = true
		case 'a' <= ch && ch <= 'z':
			hasLower = true
		}
	}

	return hasUpper && hasLower
}

// 🔹 Validate struct manually (Fiber style)
func ValidateStruct(data interface{}) error {
	return validate.Struct(data)
}

// 🔹 Format errors for response
func FormatValidationErrors(err error) fiber.Map {
	var errors []string

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			switch e.Tag() {

			case "required":
				errors = append(errors, fmt.Sprintf("%s is required", e.Field()))

			case "email":
				errors = append(errors, fmt.Sprintf("%s must be a valid email", e.Field()))

			case "name":
				errors = append(errors, fmt.Sprintf("%s must contain at least 3 letters", e.Field()))

			case "password":
				errors = append(errors, fmt.Sprintf("%s must contain uppercase and lowercase letters", e.Field()))

			default:
				errors = append(errors, fmt.Sprintf("%s is invalid", e.Field()))
			}
		}
	} else {
		errors = append(errors, "Invalid request")
	}

	return fiber.Map{
		"errors": errors,
	}
}