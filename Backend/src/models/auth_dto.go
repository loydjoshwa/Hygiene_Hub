package models

type SignupRequest struct {
	Name            string `json:"name" validate:"required,name"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,password"`
	ConfirmPassword string `json:"confirmpassword" validate:"required,eqfield=Password"`
}

type VerifyOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
	OTP   string `json:"otp" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type ResendOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Email           string `json:"email" validate:"required,email"`
	OTP             string `json:"otp" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,password"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}
