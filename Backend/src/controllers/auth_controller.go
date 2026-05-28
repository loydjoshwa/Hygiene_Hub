package controllers

import (
	"hygienehub/src/dto"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"
	"hygienehub/utils/validation"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(service *services.AuthService) *AuthController {
	return &AuthController{authService: service}
}

// 🔹 Helper: Parse + Validate
func parseAndValidate(c *fiber.Ctx, req interface{}) bool {
	if err := c.BodyParser(req); err != nil {
		logger.Log.Warnf("Body parsing failed: %v | Content-Type: %s", err, c.Get("Content-Type"))
		c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": "Invalid request body"})
		return false
	}

	if err := validation.ValidateStruct(req); err != nil {
		c.Status(constant.BADREQUEST).
			JSON(validation.FormatValidationErrors(err))
		return false
	}

	return true
}

// 📝 Signup
func (a *AuthController) Signup(c *fiber.Ctx) error {
	var req dto.SignupRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	err := a.authService.Signup(req.Name, req.Email, req.Password)
	if err != nil {
		logger.Log.Error("Signup failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Signup successful, OTP sent",
	})
}

// ✅ Verify OTP
func (a *AuthController) VerifyOTP(c *fiber.Ctx) error {
	var req dto.VerifyOTPRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	if err := a.authService.VerifyOTP(req.Email, req.OTP); err != nil {
		logger.Log.Warn("OTP failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Account verified",
	})
}

// 🔁 Resend OTP
func (a *AuthController) ResendOTP(c *fiber.Ctx) error {
	var req dto.ResendOTPRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	if err := a.authService.ResendOTP(req.Email); err != nil {
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "OTP resent successfully",
	})
}

// 🔐 Login
func (a *AuthController) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	access, refresh, user, err := a.authService.Login(req.Email, req.Password)
	if err != nil {
		logger.Log.Warn("Login failed:", err)
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"access_token":  access,
		"refresh_token": refresh,
		"role":          user.Role,
	})
}

// 🔄 Refresh Token
func (a *AuthController) Refresh(c *fiber.Ctx) error {
	var req dto.RefreshTokenRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	access, refresh, err := a.authService.Refresh(req.RefreshToken)
	if err != nil {
		logger.Log.Warn("Refresh failed:", err)
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// 🚪 Logout
func (a *AuthController) Logout(c *fiber.Ctx) error {
	var req dto.LogoutRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	sessionID, ok := c.Locals("session_id").(string)
	if !ok || sessionID == "" {
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": "Unauthorized"})
	}

	if err := a.authService.Logout(sessionID, req.RefreshToken); err != nil {
		logger.Log.Error("Logout failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// 🛡️ Dashboard (Protected Route)
func (a *AuthController) Dashboard(c *fiber.Ctx) error {

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": "Unauthorized"})
	}

	role, _ := c.Locals("role").(string)

	user, err := a.authService.GetUserByID(userID)
	if err != nil {
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "Failed to get user"})
	}

	return c.JSON(fiber.Map{
		"message":    "Welcome to Dashboard",
		"user_id":    userID,
		"name":       user.Name,
		"role":       role,
		"is_blocked": user.IsBlocked,
		"address":    user.Address,
		"state":      user.State,
		"pincode":    user.Pincode,
		"phone":      user.Phone,
	})
}

// 🔐 Forgot Password
func (a *AuthController) ForgotPassword(c *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	if err := a.authService.ForgotPassword(req.Email); err != nil {
		logger.Log.Error("Forgot Password failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "OTP sent successfully",
	})
}

// 🔑 Reset Password
func (a *AuthController) ResetPassword(c *fiber.Ctx) error {
	var req dto.ResetPasswordRequest

	if !parseAndValidate(c, &req) {
		return nil
	}

	if err := a.authService.ResetPassword(req.Email, req.OTP, req.NewPassword); err != nil {
		logger.Log.Error("Reset Password failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successful",
	})
}
