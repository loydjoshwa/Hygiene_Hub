package controllers

import (
	"github.com/gofiber/fiber/v2"
	"hygienehub/src/models"
	"hygienehub/src/services"
	"hygienehub/utils/constant"
	"hygienehub/utils/logger"
	"hygienehub/utils/validation"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(service *services.AuthService) *AuthController {
	return &AuthController{authService: service}
}

func parseAndValidate(c *fiber.Ctx, req interface{}) error {
	if err := c.BodyParser(req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}
	if err := validation.ValidateStruct(req); err != nil {
		return c.Status(constant.BADREQUEST).JSON(validation.FormatValidationErrors(err))
	}
	return nil
}

//signup

func (a *AuthController) Signup(c *fiber.Ctx) error {
	var req models.SignupRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	logger.Log.Info("Signup:", req.Email)

	err := a.authService.Signup(req.Name, req.Email, req.Password)
	if err != nil {
		logger.Log.Error("Signup failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Signup successful, OTP sent",
	})
}

//verify otp
func (a *AuthController) VerifyOTP(c *fiber.Ctx) error {
	var req models.VerifyOTPRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	err := a.authService.VerifyOTP(req.Email, req.OTP)
	if err != nil {
		logger.Log.Warn("OTP failed:", err)
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Account verified",
	})
}

//resend otp
func (a *AuthController) ResendOTP(c *fiber.Ctx) error {
	var req models.ResendOTPRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	if err := a.authService.ResendOTP(req.Email); err != nil {
		return c.Status(constant.BADREQUEST).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).
		JSON(fiber.Map{"message": "OTP resent successfully"})
}

//login

func (a *AuthController) Login(c *fiber.Ctx) error {
	var req models.LoginRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	access, refresh, user, err := a.authService.Login(req.Email, req.Password)
	if err != nil {
		logger.Log.Error("Login failed:", err)
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"access_token":  access,
		"refresh_token": refresh,
		"role":          user.Role,
	})
}

//refresh token

func (a *AuthController) Refresh(c *fiber.Ctx) error {
	var body models.RefreshTokenRequest

	if err := parseAndValidate(c, &body); err != nil {
		return err
	}

	newAccess, newRefresh, err := a.authService.Refresh(body.RefreshToken)
	if err != nil {
		logger.Log.Warn("Refresh failed", err)
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"new_access_token":  newAccess,
		"new_refresh_token": newRefresh,
	})
}

//logout
func (a *AuthController) Logout(c *fiber.Ctx) error {
	var body models.LogoutRequest

	if err := parseAndValidate(c, &body); err != nil {
		return err
	}

	sessionID, ok := c.Locals("session_id").(string)
	if !ok || sessionID == "" {
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": "unauthorized"})
	}

	err := a.authService.Logout(sessionID, body.RefreshToken)
	if err != nil {
		logger.Log.Error("Logout failed:", err)
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).
		JSON(fiber.Map{"message": "Logged out successfully"})
}

func (a *AuthController) Dashboard(c *fiber.Ctx) error {

	// get values set by middleware
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(constant.UNAUTHORIZED).
			JSON(fiber.Map{"error": "unauthorized"})
	}

	role, _ := c.Locals("role").(string)

	// fetch user from service
	user, err := a.authService.GetUserByID(userID)
	if err != nil {
		return c.Status(constant.INTERNALSERVERERROR).
			JSON(fiber.Map{"error": "failed to get user info"})
	}

	// response
	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Welcome to User Dashboard",
		"user_id": userID,
		"name":    user.Name,
		"role":    role,
	})
}

//forgot password
func (a *AuthController) ForgotPassword(c *fiber.Ctx) error {
	var req models.ForgotPasswordRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	err := a.authService.ForgotPassword(req.Email)
	if err != nil {
		logger.Log.Error("Forgot Password failed:", err)
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "OTP sent successfully",
	})
}

//reset password
func (a *AuthController) ResetPassword(c *fiber.Ctx) error {
	var req models.ResetPasswordRequest

	if err := parseAndValidate(c, &req); err != nil {
		return err
	}

	err := a.authService.ResetPassword(req.Email, req.OTP, req.NewPassword)
	if err != nil {
		logger.Log.Error("Reset Password failed:", err)
		return c.Status(constant.BADREQUEST).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(constant.SUCCESS).JSON(fiber.Map{
		"message": "Password has been successfully reset.",
	})
}

