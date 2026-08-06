import { Router } from "express";
import { loginValidator, forgotPasswordValidator, resetPasswordValidator, activateAccountValidator, verifyOtpValidator} from "../../shared/validator/validator";
import { validate } from "../../shared/middlewares/auth.middleware";
import { loginController, logoutController, forgotPasswordController, 
    resetPasswordController, activateUserController, verifyOtpController
 } from "../auth/auth.controller"
import { loginLimiter } from "../../shared/middlewares/rateLimit.middleware"
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware"
import { Permission } from "../../shared/permission";


const router = Router();

router.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Auth routes are currently in development.",
    });
});

router.post("/login", loginLimiter, validate(loginValidator), loginController)
router.post("/logout", authenticate, authorize(Permission.LOGOUT_USER), logoutController)
router.post("/forgot-password", validate(forgotPasswordValidator), forgotPasswordController)
router.post("/reset-password", validate(resetPasswordValidator), resetPasswordController)
router.post("/activate-account", validate(activateAccountValidator), activateUserController)
router.post("/verify-otp", validate(verifyOtpValidator), verifyOtpController)

export default router;