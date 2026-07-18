import { Router } from "express";
import { loginValidator, CreateAdminValidator, forgotPasswordValidator, resetPasswordValidator } from "../../shared/validator/validator";
import { validate } from "../../shared/middlewares/auth.middleware";
import { loginController, logoutController, forgotPasswordController, resetPasswordController } from "../auth/auth.controller"
import { loginLimiter } from "../../shared/middlewares/rateLimit.middleware"
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware"
import { log } from "console";
import { Permission } from "../../shared/permission";
import { PassThrough } from "stream";


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


export default router;