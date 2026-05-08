const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const rateLimiter = require("../middleware/rateLimiter");
const controller = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  tokenSchema,
  refreshSchema,
  logoutSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", rateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post("/verify-email", rateLimiter, validate(tokenSchema), asyncHandler(controller.verifyEmail));
router.get("/verify-email", rateLimiter, asyncHandler(controller.verifyEmail));
router.post("/login", rateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/refresh", validate(refreshSchema), asyncHandler(controller.refresh));
router.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));
router.post("/password-reset/request", rateLimiter, validate(requestPasswordResetSchema), asyncHandler(controller.requestPasswordReset));
router.post("/password-reset/confirm", rateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));

module.exports = router;
