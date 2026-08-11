import { Router } from "express";
import {z} from "zod";
import { authenticate , authorize} from "../../../shared/middlewares/auth.middleware";
import {validate} from "../../../shared/middlewares/auth.middleware";
import { Permission } from "../../../shared/permission";
import {
  getTeacherCoursesController,
  getCourseStudentsController,
   bulkUploadResultsController,
  updateResultEntryController,
  getCourseResultsController,
  getStudentResultsController,
   getTeacherFlaggedResultsController,
  getTeacherFlaggedEntryByIdController,
  resolveFlaggedEntryController,
  reopenFlaggedResultController
} from './teacher.controller';

import {getMyNotificationsController} from "../admin/admin.controller"
import { getCourseStudentsQuerySchema,  bulkUploadResultsSchema,
  updateResultEntrySchema,
  getResultsQuerySchema, } from '../../../shared/validator/validator';

const router = Router();

router.use(authenticate);

router.get("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route retrieves the teacher's profile." });
});

router.patch("/profile", (req, res) => {
    res.status(200).json({ success: true, message: "This route is currently in development. This route updates the teacher's profile." });
});

router.get(
  '/courses',
  authenticate,
  authorize(Permission.VIEW_TEACHER_COURSES),
  getTeacherCoursesController
);

// Get students for a specific course
router.get(
  '/courses/:courseId/students',
  authenticate,
  authorize(Permission.VIEW_COURSE_STUDENTS),
  validate(getCourseStudentsQuerySchema, 'query'),
  getCourseStudentsController
);


// Bulk upload results for a course
router.post(
  '/courses/:courseId/results',
  authorize(Permission.UPLOAD_RESULTS),
  validate(bulkUploadResultsSchema),
  bulkUploadResultsController
);

// Update a single result entry
router.patch(
  '/results/:entryId',
  authorize(Permission.UPDATE_RESULTS),
  validate(updateResultEntrySchema),
  updateResultEntryController
);

// Get results for a course (teacher view)
router.get(
  '/courses/:courseId/results',
  authorize(Permission.VIEW_RESULTS),
  validate(getResultsQuerySchema, 'query'),
  getCourseResultsController
);

router.get(
  '/students/:studentId/results',
  authorize(Permission.VIEW_RESULTS),
  getStudentResultsController
);


// Get all flagged results for teacher's courses
router.get(
  '/results/flagged',
  authorize(Permission.VIEW_FLAGGED_RESULTS),
  getTeacherFlaggedResultsController
);

// Get a specific flagged entry by ID
router.get(
  '/results/flagged/:entryId',
  authorize(Permission.VIEW_FLAGGED_RESULTS),
  getTeacherFlaggedEntryByIdController
);

// Resolve a flagged entry
router.patch(
  '/results/flagged/:entryId/resolve',
  authorize(Permission.RESOLVE_FLAGGED_RESULTS),
  validate(z.object({
    resolutionDescription: z.string().min(1, "Resolution description is required"),
  })),
  resolveFlaggedEntryController
);

// Unresolve a flagged entry (remove resolution)
router.delete(
  '/results/flagged/:entryId/resolve',
  authorize(Permission.RESOLVE_FLAGGED_RESULTS),
  reopenFlaggedResultController
);


router.get("/notifications", 
  getMyNotificationsController
)

export default router;
