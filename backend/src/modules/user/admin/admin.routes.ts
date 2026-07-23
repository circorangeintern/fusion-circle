
import { Router } from "express";
import { CreateSchoolValidator, updateSchoolValidator } from "../../../shared/validator/validator";
import { validate } from "../../../shared/middlewares/auth.middleware";
import {
    createSchoolController,
    updateSchoolController,
    // CreateAdmin, DeactivateAdmin,
    //getAllAdmins, getAdminById, logoutController
} from "./admin.controller"
import { loginLimiter } from "../../../shared/middlewares/rateLimit.middleware"
import { authenticate, authorize } from "../../../shared/middlewares/auth.middleware"
import { log } from "console";
import { Permission } from "../../../shared/permission";

const router = Router();

router.get("/", (req, res) => {
    console.log("Admin routes are ready for development.");

    res.status(200).json({
        success: true,
        message: "Admin routes are ready for development.",
    });
});


router.post("/schools",
    authenticate,
    authorize(Permission.CREATE_SCHOOL),
    validate(CreateSchoolValidator),
    createSchoolController)


router.patch(
    "/schools/:pin",
    authenticate,
    authorize(Permission.UPDATE_SCHOOL),
    validate(updateSchoolValidator),
    updateSchoolController
);

// Schools
router.get("/schools", (req, res) => {
    res.status(200).json({ success: true, message: "This route retrieves all schools." });
});

router.get("/schools/:pin", (req, res) => {
    res.status(200).json({ success: true, message: `This route retrieves a specific school by its PIN: ${req.params.pin}` });
});

// Students
router.post("/students", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates a new student." });
});

router.post("/students/bulk", (req, res) => {
    res.status(200).json({ success: true, message: "This route performs bulk import/creation of students." });
});

router.post("/students/custom", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates a custom amount of student." });
});

router.get("/students", (req, res) => {
    res.status(200).json({ success: true, message: "This route retrieves all students." });
});

router.get("/students/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route retrieves a specific student by ID: ${req.params.id}` });
});

router.patch("/students/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route updates student details by ID: ${req.params.id}` });
});

router.patch("/students/:id/activate", (req, res) => {
    res.status(200).json({ success: true, message: `This route activates a student account by ID: ${req.params.id}` });
});

router.patch("/students/:id/deactivate", (req, res) => {
    res.status(200).json({ success: true, message: `This route deactivates a student account by ID: ${req.params.id}` });
});

// Teachers
router.post("/teachers", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates a new teacher." });
});

router.post("/teachers/bulk", (req, res) => {
    res.status(200).json({ success: true, message: "This route performs bulk import/creation of teachers." });
});

router.post("/teachers/custom", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates a custom amount of teachers." });
});

router.get("/teachers", (req, res) => {
    res.status(200).json({ success: true, message: "This route retrieves all teachers." });
});

router.get("/teachers/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route retrieves a specific teacher by ID: ${req.params.id}` });
});

router.patch("/teachers/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route updates teacher details by ID: ${req.params.id}` });
});

router.patch("/teachers/:id/activate", (req, res) => {
    res.status(200).json({ success: true, message: `This route activates a teacher account by ID: ${req.params.id}` });
});

router.patch("/teachers/:id/deactivate", (req, res) => {
    res.status(200).json({ success: true, message: `This route deactivates a teacher account by ID: ${req.params.id}` });
});

// Courses
router.post("/courses", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates a new course." });
});

router.post("/courses/bulk", (req, res) => {
    res.status(200).json({ success: true, message: "This route performs bulk import/creation of courses." });
});

router.post("/courses/custom", (req, res) => {
    res.status(200).json({ success: true, message: "This route creates custom amount of  courses ." });
});

router.get("/courses", (req, res) => {
    res.status(200).json({ success: true, message: "This route retrieves all courses." });
});

router.get("/courses/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route retrieves a specific course by ID: ${req.params.id}` });
});

router.patch("/courses/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route updates course details by ID: ${req.params.id}` });
});

// Departments
router.post("/departments", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route creates a new department." });
});

router.post("/departments/bulk", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route performs bulk import/creation of departments." });
});

router.post("/departments/custom", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development.This route creates a department with custom parameters." });
});

router.get("/departments", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves all departments." });
});

router.get("/departments/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves a specific department by ID: ${req.params.id}` });
});

router.patch("/departments/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route updates department details by ID: ${req.params.id}` });
});

// Classes
router.get("/classes", (req, res) => {
    res.status(200).json({ success: true, message: "This route retrieves all classes and details." });
});

router.get("/classes/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route retrieves a specific class and its details by ID: ${req.params.id}` });
});

router.patch("/classes/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route updates class details by ID: ${req.params.id}` });
});

export default router;