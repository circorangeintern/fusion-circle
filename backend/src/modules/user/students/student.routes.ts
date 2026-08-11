import { Router } from "express";
import {getStudentCoursesQuerySchema,registerCoursesSchema , getResultsQuerySchema,
  flagResultSchema,
  getStudentResultsQuerySchema,
  unflagResultSchema, } from "../../../shared/validator/validator";
import { authenticate } from "../../../shared/middlewares/auth.middleware";
import {validate} from "../../../shared/middlewares/auth.middleware";
import { flagResultController, getStudentCoursesController, getStudentResultsController, 
    registerCoursesController, unflagResultController, getFlaggedResultsController,
  getFlaggedEntryByIdController, } from "./student.controllers";
import { getMyNotificationsController } from "../admin/admin.controller";


const router = Router();
router.use(authenticate);

router.get("/notifications/me", 
  getMyNotificationsController
)

router.get("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves the student's profile." });
});

router.patch("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route updates the student's profile." });
});

router.get("/dashboard", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves student dashboard analytics/overview." });
});


router.get(
    '/courses',
    validate(getStudentCoursesQuerySchema, 'query'), 
    getStudentCoursesController
);

router.post(
  '/courses/register',
  validate(registerCoursesSchema),
  registerCoursesController
);

// Get student's own results
router.get(
  '/courses/results',
  validate(getStudentResultsQuerySchema, 'query'),
  getStudentResultsController
);

// Flag a result (student flags their own result)
router.patch(
  '/courses/results/:entryId/flag',
  validate(flagResultSchema),
  flagResultController
);

// Unflag a result (student removes flag from their result)
router.patch(
  '/courses/results/:entryId/unflag',
  validate(unflagResultSchema),
  unflagResultController
);

// Get all flagged results for the authenticated student
router.get(
  '/results/flags',
  getFlaggedResultsController
);

// Get a specific flagged entry by entry ID
router.get(
  '/results/flags/:entryId',
  getFlaggedEntryByIdController
);


export default router;
