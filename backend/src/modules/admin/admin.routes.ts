import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    console.log("Admin routes are ready for development.");

    res.status(200).json({
        success: true,
        message: "Admin routes are ready for development.",
    });
});

export default router;