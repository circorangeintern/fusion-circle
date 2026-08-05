
import { Router } from "express";
import {
    CreateSchoolValidator, UpdateSchoolValidator,
    studentRowSchema, updateStudentSchema,
    teacherRowSchema, updateTeacherSchema,
    createCourseSchema, updateCourseSchema,
    updateSchoolConfigSchema
} from "../../../shared/validator/validator";
import { validate } from "../../../shared/middlewares/auth.middleware";
import {
    createSchoolController,
    updateSchoolController,
    readSchoolController,
    CreateBulkStudentsController, createStudentController,
    getStudentsController, getStudentByIdController, updateStudentController,
    CreateBulkTeachersController, createTeacherController,
    getTeachersController, getTeacherByIdController, updateTeacherController,
    bulkUploadCoursesController, createCourseController, updateCourseController,
    getCoursesController, getCourseByIdController, deleteCourseByIdController,
    addTeacherToCourseController, removeTeacherFromCourseController,
    activateUserController, deactivateUserController,
    getSchoolConfigController, updateSchoolConfigController
    // CreateAdmin, DeactivateAdmin,
    //getAllAdmins, getAdminById, logoutController
} from "./admin.controller"
import { loginLimiter } from "../../../shared/middlewares/rateLimit.middleware"
import { authenticate, authorize } from "../../../shared/middlewares/auth.middleware"
import { Permission } from "../../../shared/permission";
import { upload } from "../../../shared/middlewares/csvFilter";


const router = Router();

router.get("/", (req, res) => {
    req.log.info("Admin routes health check");

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
    "/schools/:id",
    authenticate,
    authorize(Permission.UPDATE_SCHOOL),
    validate(UpdateSchoolValidator),
    updateSchoolController
);

// Schools
router.get("/schools",
    authenticate,
    authorize(Permission.READ_SCHOOL),
    readSchoolController
);

router.get("/schools/config",
    authenticate,
    authorize(Permission.READ_SCHOOL),
    getSchoolConfigController
);

router.put("/schools/config",
    authenticate,
    authorize(Permission.UPDATE_SCHOOL),
    validate(updateSchoolConfigSchema),
    updateSchoolConfigController
);



//auth
router.patch("/users/:id/activate",
    authenticate,
    authorize(Permission.UPDATE_USER),
    activateUserController

);

router.patch("/users/:id/deactivate",
    authenticate,
    authorize(Permission.UPDATE_USER),
    deactivateUserController
);


// Students
router.post("/students",
  authenticate,
  authorize(Permission.CREATE_STUDENT),
    validate(studentRowSchema),
    createStudentController);


router.post(
    "/students/bulk",
    authenticate,
    authorize(Permission.CREATE_STUDENT),
    upload.single("resultTrackStudent"),
    CreateBulkStudentsController
);

;

router.get("/students",
    authenticate,
    authorize(Permission.READ_STUDENT),
    getStudentsController
);

router.get("/students/:id",
    authenticate,
    authorize(Permission.READ_STUDENT),
    getStudentByIdController);

router.patch("/students/:id",
    authenticate,
    authorize(Permission.UPDATE_STUDENT),
    validate(updateStudentSchema),
    updateStudentController);



// Teachers
router.post("/teachers",
    authenticate,
    authorize(Permission.CREATE_TEACHER),
    validate(teacherRowSchema),
    createTeacherController);

router.post("/teachers/bulk",
    authenticate,
    authorize(Permission.CREATE_TEACHER),
    upload.single("resultTrackTeacher"),
    CreateBulkTeachersController);



router.get("/teachers",
    authenticate,
    authorize(Permission.READ_TEACHER),
    getTeachersController
);

router.get("/teachers/:id",
    authenticate,
    authorize(Permission.READ_TEACHER),
    getTeacherByIdController);

router.patch("/teachers/:id",
    authenticate,
    authorize(Permission.UPDATE_TEACHER),
    validate(updateTeacherSchema),
    updateTeacherController);

router.put('/courses/:courseId/teachers/:teacherId',
    authenticate,
    authorize(Permission.UPDATE_COURSE),
    addTeacherToCourseController);


router.delete('/courses/:courseId/teachers/:teacherId',
    authenticate,
    authorize(Permission.UPDATE_COURSE),
    removeTeacherFromCourseController
)


// Courses
router.post("/courses",
    authenticate,
    authorize(Permission.CREATE_COURSE),
    validate(createCourseSchema),
    createCourseController
);

router.post("/courses/bulk",
    authenticate,
    authorize(Permission.CREATE_COURSE),
    upload.single("resultTrackCourse"),
    bulkUploadCoursesController
);



router.get("/courses",
    authenticate,
    authorize(Permission.READ_COURSE),
    getCoursesController
);

router.get("/courses/:id",
    authenticate,
    authorize(Permission.READ_COURSE),
    getCourseByIdController
);

router.patch("/courses/:id",
    authenticate,
    authorize(Permission.UPDATE_COURSE),
    validate(updateCourseSchema),
    updateCourseController
);

router.delete("/courses/:id",
    authenticate,
    authorize(Permission.DELETE_COURSE),
    deleteCourseByIdController
);

// Departments
router.post("/departments", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route creates a new department." });
});

router.get("/departments", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves all departments." });
});

router.get("/departments/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves a specific department by ID: ${req.params.id}` });
});


// Classes
router.get("/classes", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves all classes and details." });
});

router.get("/classes/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route retrieves a specific class and its details by ID: ${req.params.id}` });
});

router.patch("/classes/:id", (req, res) => {
    res.status(200).json({ success: true, message: `This route is currently in development. This route updates class details by ID: ${req.params.id}` });
});

export default router;