import { registry } from "../../../contracts/registry";
import { z } from "zod";

import {
  getCourseStudentsQuerySchema,
  bulkUploadResultsSchema,
  updateResultEntrySchema,
  getResultsQuerySchema,
} from "../../../shared/validator/validator";

import {
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../../../contracts/schemas/sharedSchema";
import { GetNotificationsResponseSchema } from "../../../contracts/schemas/sharedSchema";

// ----------------------------
// Response & Body Schemas
// ----------------------------

const TeacherProfileResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const CourseBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.string().nullable(),
  year: z.string().nullable(),
  class: z.string().nullable(),
  isActive: z.boolean(),
});

const TeacherDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const StudentDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  regNo: z.string().nullable(),
  email: z.string().email(),
  department: z.string().nullable(),
  year: z.string().nullable(),
  class: z.string().nullable(),
});

const GetTeacherCoursesResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    totalCourses: z.number(),
    totalStudents: z.number(),
    courses: z.array(
      CourseBaseSchema.extend({
        stats: z.object({
          totalStudents: z.number(),
          totalTeachers: z.number(),
        }),
        teachers: z.array(TeacherDetailsSchema),
        students: z.array(StudentDetailsSchema),
      })
    ),
  }),
});

const GetCourseStudentsResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    course: CourseBaseSchema,
    teachers: z.array(TeacherDetailsSchema),
    students: z.array(StudentDetailsSchema),
    total: z.number(),
  }),
});

const BulkUploadResultsResponseSchema = z.object({
  success: z.boolean(),
  code: z.literal("OK").or(z.literal("PARTIAL_SUCCESS")),
  message: z.string(),
  data: z.object({
    course: CourseBaseSchema.omit({ isActive: true }),
    totalProcessed: z.number(),
    successful: z.number(),
    failed: z.number(),
    results: z.array(
      z.object({
        studentId: z.number(),
        studentName: z.string(),
        regNo: z.string().nullable(),
        caScore: z.number(),
        examScore: z.number(),
        totalScore: z.number(),
        grade: z.string(),
        status: z.string(),
        entryId: z.number(),
      })
    ),
    errors: z
      .array(
        z.object({
          studentId: z.number(),
          reason: z.string(),
        })
      )
      .optional(),
  }),
});

const SingleResultEntrySchema = z.object({
  id: z.number(),
  studentId: z.number(),
  studentName: z.string(),
  courseId: z.number(),
  courseName: z.string(),
  caScore: z.number(),
  examScore: z.number(),
  totalScore: z.number(),
  grade: z.string(),
  status: z.string(),
  flag: z.string(),
});

const UpdateResultEntryResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    entry: SingleResultEntrySchema,
  }),
});

const GetCourseResultsResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    course: CourseBaseSchema.omit({ isActive: true }),
    totalEntries: z.number(),
    filteredEntries: z.number(),
    results: z.array(
      z.object({
        id: z.number(),
        studentId: z.number(),
        studentName: z.string(),
        regNo: z.string().nullable(),
        email: z.string().email(),
        caScore: z.number(),
        examScore: z.number(),
        totalScore: z.number(),
        grade: z.string(),
        status: z.string(),
        flag: z.string(),
        updatedAt: z.string(),
      })
    ),
  }),
});

const GetStudentResultsResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    student: StudentDetailsSchema,
    results: z.array(
      z.object({
        resultId: z.number(),
        submittedAt: z.string(),
        updatedAt: z.string(),
        courses: z.array(
          z.object({
            courseId: z.number(),
            courseName: z.string(),
            department: z.string().nullable(),
            year: z.string().nullable(),
            class: z.string().nullable(),
            caScore: z.number(),
            examScore: z.number(),
            totalScore: z.number(),
            grade: z.string(),
            status: z.string(),
          })
        ),
        totalCourses: z.number(),
      })
    ),
  }),
});

const FlaggedEntrySchema = z.object({
  entryId: z.number(),
  studentId: z.number(),
  studentName: z.string(),
  regNo: z.string().nullable(),
  email: z.string().email(),
  courseId: z.number(),
  courseName: z.string(),
  department: z.string().nullable(),
  year: z.string().nullable(),
  class: z.string().nullable(),
  caScore: z.number(),
  examScore: z.number(),
  totalScore: z.number(),
  grade: z.string(),
  status: z.string(),
  flag: z.string(),
  flagDescription: z.string().nullable(),
  resolutionDescription: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  isResolved: z.boolean(),
  submittedAt: z.string(),
  updatedAt: z.string(),
});

const GetTeacherFlaggedResultsResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    teacher: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
    }),
    summary: z.object({
      totalFlagged: z.number(),
      resolved: z.number(),
      unresolved: z.number(),
    }),
    flaggedEntries: z.array(FlaggedEntrySchema),
  }),
});

const GetFlaggedEntryByIdResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: FlaggedEntrySchema,
});

const ResolveFlaggedEntryRequestSchema = z.object({
  resolutionDescription: z.string().min(1, "Resolution description is required"),
});

const ResolveFlaggedEntryResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: FlaggedEntrySchema.omit({ submittedAt: true, updatedAt: true }),
});

const ReopenFlaggedResultResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    entryId: z.number(),
    courseId: z.number(),
    courseName: z.string(),
    department: z.string().nullable(),
    year: z.string().nullable(),
    class: z.string().nullable(),
    flag: z.string(),
    flagDescription: z.string().nullable(),
    resolutionDescription: z.string().nullable(),
    resolvedAt: z.string().nullable(),
    isResolved: z.boolean(),
  }),
});

// ----------------------------
// Register Schemas
// ----------------------------

registry.register("GetTeacherCoursesResponse", GetTeacherCoursesResponseSchema);
registry.register("GetCourseStudentsResponse", GetCourseStudentsResponseSchema);
registry.register("BulkUploadResultsResponse", BulkUploadResultsResponseSchema);
registry.register("UpdateResultEntryResponse", UpdateResultEntryResponseSchema);
registry.register("GetCourseResultsResponse", GetCourseResultsResponseSchema);
registry.register("GetStudentResultsResponse", GetStudentResultsResponseSchema);
registry.register("GetTeacherFlaggedResultsResponse", GetTeacherFlaggedResultsResponseSchema);
registry.register("GetFlaggedEntryByIdResponse", GetFlaggedEntryByIdResponseSchema);
registry.register("ResolveFlaggedEntryRequest", ResolveFlaggedEntryRequestSchema);
registry.register("ResolveFlaggedEntryResponse", ResolveFlaggedEntryResponseSchema);
registry.register("ReopenFlaggedResultResponse", ReopenFlaggedResultResponseSchema);

// ----------------------------
// Register Paths
// ----------------------------

registry.registerPath({
  method: "get",
  path: "/teacher/profile",
  tags: ["Teacher"],
  operationId: "getTeacherProfile",
  summary: "Get Teacher Profile",
  description: "Retrieves the profile of the authenticated teacher (in development).",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Profile retrieved", content: { "application/json": { schema: TeacherProfileResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/teacher/profile",
  tags: ["Teacher"],
  operationId: "updateTeacherProfile",
  summary: "Update Teacher Profile",
  description: "Updates the profile details for the authenticated teacher (in development).",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Profile updated", content: { "application/json": { schema: TeacherProfileResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/courses",
  tags: ["Teacher"],
  operationId: "getTeacherCourses",
  summary: "Get Assigned Courses",
  description: "Retrieve courses assigned to the authenticated teacher with statistical summaries.",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Assigned courses retrieved", content: { "application/json": { schema: GetTeacherCoursesResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

// Notifications
registry.registerPath({
  method: "get",
  path: "/teacher/notifications/me",
  tags: ["Teacher"],
  operationId: "getTeacherNotifications",
  summary: "Get My Notifications",
  description: "Retrieve notifications for the authenticated teacher. Supports query params: isRead, limit, markAsRead.",
  security: [{ sessionAuth: [] }],
  request: {
    query: z.object({ isRead: z.string().optional(), limit: z.string().optional(), markAsRead: z.string().optional() }),
  },
  responses: {
    200: { description: "Notifications retrieved", content: { "application/json": { schema: GetNotificationsResponseSchema } } },
    400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/courses/\:courseId/students",
  tags: ["Teacher"],
  operationId: "getCourseStudents",
  summary: "Get Students for a Course",
  description: "Retrieve a list of students registered for a specific course assigned to the teacher.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ courseId: z.string() }),
    query: getCourseStudentsQuerySchema,
  },
  responses: {
    200: { description: "Course students retrieved", content: { "application/json": { schema: GetCourseStudentsResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/teacher/courses/\:courseId/results",
  tags: ["Teacher"],
  operationId: "bulkUploadResults",
  summary: "Bulk Upload Course Results",
  description: "Upload grades and scores for students enrolled in the specified course.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ courseId: z.string() }),
    body: {
      required: true,
      content: { "application/json": { schema: bulkUploadResultsSchema } },
    },
  },
  responses: {
    200: { description: "Bulk upload processed", content: { "application/json": { schema: BulkUploadResultsResponseSchema } } },
    207: { description: "Partial failure processed", content: { "application/json": { schema: BulkUploadResultsResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/teacher/results/\:entryId",
  tags: ["Teacher"],
  operationId: "updateResultEntry",
  summary: "Update Single Result",
  description: "Update the continuous assessment, exam score, or flag status for an entry.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
    body: {
      required: true,
      content: { "application/json": { schema: updateResultEntrySchema } },
    },
  },
  responses: {
    200: { description: "Result entry updated", content: { "application/json": { schema: UpdateResultEntryResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/courses/\:courseId/results",
  tags: ["Teacher"],
  operationId: "getCourseResults",
  summary: "Get Course Results",
  description: "Retrieve grade lists and performance results for a specific course assigned to the teacher.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ courseId: z.string() }),
    query: getResultsQuerySchema,
  },
  responses: {
    200: { description: "Course results retrieved", content: { "application/json": { schema: GetCourseResultsResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/students/\:studentId/results",
  tags: ["Teacher"],
  operationId: "getStudentResults",
  summary: "Get Student Results",
  description: "View graded reports and results across courses for a specific student.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ studentId: z.string() }),
  },
  responses: {
    200: { description: "Student results retrieved", content: { "application/json": { schema: GetStudentResultsResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ErrorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/results/flagged",
  tags: ["Teacher"],
  operationId: "getTeacherFlaggedResults",
  summary: "Get Flagged Results",
  description: "Retrieve all active and resolved flagged results belonging to courses assigned to the teacher.",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Flagged results retrieved", content: { "application/json": { schema: GetTeacherFlaggedResultsResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/teacher/results/flagged/\:entryId",
  tags: ["Teacher"],
  operationId: "getTeacherFlaggedEntryById",
  summary: "Get Flagged Result Details",
  description: "Retrieve metadata and details for a specific flagged result entry.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
  },
  responses: {
    200: { description: "Flagged entry details retrieved", content: { "application/json": { schema: GetFlaggedEntryByIdResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ErrorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/teacher/results/flagged/\:entryId/resolve",
  tags: ["Teacher"],
  operationId: "resolveFlaggedEntry",
  summary: "Resolve Flagged Result",
  description: "Provide description notes to resolve an active student-flagged result.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
    body: {
      required: true,
      content: { "application/json": { schema: ResolveFlaggedEntryRequestSchema } },
    },
  },
  responses: {
    200: { description: "Flagged entry resolved", content: { "application/json": { schema: ResolveFlaggedEntryResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ErrorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "delete",
  path: "/teacher/results/flagged/\:entryId/resolve",
  tags: ["Teacher"],
  operationId: "reopenFlaggedResult",
  summary: "Reopen Flagged Result",
  description: "Reopen a previously resolved flagged entry, removing the resolution note while preserving the student flag.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
  },
  responses: {
    200: { description: "Flagged result reopened successfully", content: { "application/json": { schema: ReopenFlaggedResultResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ErrorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});