import { Router } from "express";
import { loginValidator, CreateAdminValidator } from "../../shared/validator/validator";
import { validate } from "../../shared/middlewares/auth.middleware";
import {
    loginController, CreateAdmin, DeactivateAdmin,
    getAllAdmins, getAdminById, logoutController
} from "./superAdmin.controller"
import { loginLimiter } from "../../shared/middlewares/rateLimit.middleware"
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware"
import { Permission } from "../../shared/permission";

const router = Router();

router.get("/", (req, res) => {
    req.log.info("SuperAdmin routes health check");

    res.status(200).json({
        success: true,
        message: "SuperAdmin routes are ready for development.",
    });
});

router.post("/login", loginLimiter, validate(loginValidator), loginController)
router.post("/admin", authenticate, authorize(Permission.CREATE_ADMIN), validate(CreateAdminValidator), CreateAdmin)
router.patch("/admins/:id", authenticate, authorize(Permission.DELETE_ADMIN), DeactivateAdmin)
router.get("/admins", authenticate, authorize(Permission.READ_ADMIN), getAllAdmins)
router.get("/admins/:id", authenticate, authorize(Permission.READ_ADMIN), getAdminById)
router.post("/logout", authenticate, authorize(Permission.LOGOUT_SUPERADMIN), logoutController)

// Mock/placeholder routes returning descriptions
router.patch("/admins/:id/activate", (req, res) => {
    res.status(200).json({
        success: true,
        message: "This route is currently in development. It will activate a deactivated admin account by their ID."
    });
});

router.patch("/admins/:id/deactivate", (req, res) => {
    res.status(200).json({
        success: true,
        message: "This route is currently in development. It will deactivate an active admin account by their ID."
    });
});

export default router;