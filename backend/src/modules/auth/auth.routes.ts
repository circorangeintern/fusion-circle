import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    console.log("Auth routes are ready for development.");

    res.status(200).json({
        success: true,
        message: "Auth routes are ready for development.",
    });
});


export default router;