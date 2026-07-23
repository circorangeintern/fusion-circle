import { Router } from "express";

const router = Router();

router.get("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves the student's profile." });
});

router.patch("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route updates the student's profile." });
});

router.get("/dashboard", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves student dashboard analytics/overview." });
});

router.get("/results", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves all exam/grade results for the student." });
});

router.get("/results/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves details of a specific result by ID: ${req.params.id}` });
});

router.get("/results/course/:courseId", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves student results filtered by course ID: ${req.params.courseId}` });
});

router.post("/results/:id/flag", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route flags a specific result (by ID: ${req.params.id}) for teacher review.` });
});

router.get("/flags", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves all flags raised by the student." });
});

router.get("/flags/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves details of a specific flag by ID: ${req.params.id}` });
});

export default router;
