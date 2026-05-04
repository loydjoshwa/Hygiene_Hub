package validation

import (
	"fmt"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var (
	validate      = validator.New()
	nameRegex     = regexp.MustCompile(`^[a-zA-Z\s]{3,}$`)
	hasUpperRegex = regexp.MustCompile(`[A-Z]`)
	hasLowerRegex = regexp.MustCompile(`[a-z]`)

	// errorMsgs simplifies mapping validation tags to error messages
	errorMsgs = map[string]func(validator.FieldError) string{
		"required": func(e validator.FieldError) string { return fmt.Sprintf("%s is required", e.Field()) },
		"email":    func(e validator.FieldError) string { return fmt.Sprintf("%s must be a valid email", e.Field()) },
		"name":     func(e validator.FieldError) string { return fmt.Sprintf("%s must contain at least 3 letters", e.Field()) },
		"password": func(e validator.FieldError) string { return fmt.Sprintf("%s must contain uppercase and lowercase letters", e.Field()) },
		"eqfield":  func(e validator.FieldError) string { return fmt.Sprintf("%s must match %s", e.Field(), e.Param()) },
	}
)

// InitValidation initializes custom validations.
func InitValidation() {
	validate.RegisterValidation("name", validateName)
	validate.RegisterValidation("password", validatePassword)
}

// validateName ensures the name contains at least 3 letters.
func validateName(fl validator.FieldLevel) bool {
	return nameRegex.MatchString(fl.Field().String())
}

// validatePassword ensures password is 6-20 chars with uppercase and lowercase.
func validatePassword(fl validator.FieldLevel) bool {
	p := fl.Field().String()
	return len(p) >= 6 && len(p) <= 20 && hasUpperRegex.MatchString(p) && hasLowerRegex.MatchString(p)
}

// ValidateStruct manually validates a struct.
func ValidateStruct(data interface{}) error {
	return validate.Struct(data)
}

// FormatValidationErrors formats the errors for JSON responses.
func FormatValidationErrors(err error) fiber.Map {
	var errList []string

	if valErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range valErrs {
			if msgFunc, exists := errorMsgs[e.Tag()]; exists {
				errList = append(errList, msgFunc(e))
			} else {
				errList = append(errList, fmt.Sprintf("%s is invalid", e.Field()))
			}
		}
	} else {
		errList = append(errList, "Invalid request")
	}

	return fiber.Map{"errors": errList}
}