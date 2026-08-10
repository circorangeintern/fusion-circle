import { registry } from "../../../contracts/registry";
import { z } from "zod";

import {
  getStudentCoursesQuerySchema,
  registerCoursesSchema,
  getStudentResultsQuerySchema,
  flagResultSchema,
  unflagResultSchema,
} from "../../../shared/validator/validator";

import {
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../../../contracts/schemas/sharedSchema";

// ----------------------------
// Response & Body Schemas
// ----------------------------

const StudentProfileResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const StudentDashboardResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const CourseTeacherSchema = z.object({
  userId: z.number(),
  department: z.string().nullable(),
  studentClass: z.string().nullable(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  }),
});

const StudentCourseSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.string().nullable(),
  year: z.string().nullable(),
  class: z.string().nullable(),
  isActive: z.boolean(),
  schoolId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  teachers: z.array(CourseTeacherSchema).optional(),
});

const GetStudentCoursesResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  data: z.array(StudentCourseSchema),
  total: z.number(),
});

const RegisterCoursesResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    student: z.object({
      id: z.number(),
      name: z.string(),
      regNo: z.string().nullable(),
      department: z.string().nullable(),
      year: z.string().nullable(),
      class: z.string().nullable(),
    }),
    courses: z.array(StudentCourseSchema),
    summary: z.object({
      totalRequested: z.number(),
      successfullyRegistered: z.number(),
      invalidCourses: z.number(),
      invalidCourseIds: z.array(z.number()).optional(),
    }),
  }),
});

const GetStudentResultsResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    student: z.object({
      id: z.number(),
      name: z.string(),
      regNo: z.string().nullable(),
      email: z.string().email(),
      department: z.string().nullable(),
      year: z.string().nullable(),
      class: z.string().nullable(),
    }),
    results: z.array(
      z.object({
        resultId: z.number(),
        submittedAt: z.string(),
        updatedAt: z.string(),
        courses: z.array(
          z.object({
            entryId: z.number(),
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
            isFlagged: z.boolean(),
          })
        ),
        totalCourses: z.number(),
      })
    ),
    summary: z.object({
      totalResults: z.number(),
      totalCourses: z.number(),
    }),
  }),
});

const FlagUnflagResultEntrySchema = z.object({
  id: z.number(),
  studentId: z.number(),
  studentName: z.string(),
  courseId: z.number(),
  courseName: z.string(),
  department: z.string().nullable(),
  caScore: z.number(),
  examScore: z.number(),
  totalScore: z.number(),
  grade: z.string(),
  status: z.string(),
  flag: z.string(),
  flagDescription: z.string().nullable(),
});

const FlagResultResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    entry: FlagUnflagResultEntrySchema,
  }),
});

const StudentFlaggedEntriesResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
    student: z.object({
      id: z.number(),
      name: z.string(),
      regNo: z.string().nullable(),
      email: z.string().email(),
    }),
    flaggedEntries: z.array(
      z.object({
        entryId: z.number(),
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
        submittedAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    total: z.number(),
  }),
});

const StudentFlaggedEntryByIdResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("OK"),
  message: z.string(),
  data: z.object({
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
    submittedAt: z.string(),
    updatedAt: z.string(),
  }),
});

// ----------------------------
// Register Schemas
// ----------------------------

registry.register("GetStudentCoursesResponse", GetStudentCoursesResponseSchema);
registry.register("RegisterCoursesResponse", RegisterCoursesResponseSchema);
registry.register("GetStudentOwnResultsResponse", GetStudentResultsResponseSchema);
registry.register("FlagResultResponse", FlagResultResponseSchema);
registry.register("StudentFlaggedEntriesResponse", StudentFlaggedEntriesResponseSchema);
registry.register("StudentFlaggedEntryByIdResponse", StudentFlaggedEntryByIdResponseSchema);

// ----------------------------
// Register Paths
// ----------------------------

registry.registerPath({
  method: "get",
  path: "/student/profile",
  tags: ["Student"],
  operationId: "getStudentProfile",
  summary: "Get Student Profile",
  description: "Retrieves the profile of the authenticated student (in development).",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Profile retrieved", content: { "application/json": { schema: StudentProfileResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/student/profile",
  tags: ["Student"],
  operationId: "updateStudentProfile",
  summary: "Update Student Profile",
  description: "Updates the profile details for the authenticated student (in development).",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Profile updated", content: { "application/json": { schema: StudentProfileResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/student/dashboard",
  tags: ["Student"],
  operationId: "getStudentDashboard",
  summary: "Get Student Dashboard",
  description: "Retrieves overview and analytics for the student dashboard (in development).",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Dashboard analytics retrieved", content: { "application/json": { schema: StudentDashboardResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/student/courses",
  tags: ["Student"],
  operationId: "getStudentAvailableCourses",
  summary: "Get Available Courses",
  description: "Retrieve all courses registered or available to register for the authenticated student based on school config.",
  security: [{ sessionAuth: [] }],
  request: {
    query: getStudentCoursesQuerySchema,
  },
  responses: {
    200: { description: "Available courses retrieved", content: { "application/json": { schema: GetStudentCoursesResponseSchema } } },
    400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/student/courses/register",
  tags: ["Student"],
  operationId: "registerCourses",
  summary: "Register Courses",
  description: "Replace and register the student's courses for the academic period.",
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: registerCoursesSchema } },
    },
  },
  responses: {
    200: { description: "Course registration complete", content: { "application/json": { schema: RegisterCoursesResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/student/courses/results",
  tags: ["Student"],
  operationId: "getStudentOwnResults",
  summary: "Get Personal Results",
  description: "Retrieve academic records and performance evaluations for the authenticated student.",
  security: [{ sessionAuth: [] }],
  request: {
    query: getStudentResultsQuerySchema,
  },
  responses: {
    200: { description: "Student results fetched successfully", content: { "application/json": { schema: GetStudentResultsResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/student/courses/results/\:entryId/flag",
  tags: ["Student"],
  operationId: "flagOwnResult",
  summary: "Flag Personal Result",
  description: "Flag a specific result entry to request correction or review from the assigning teacher.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
    body: {
      required: true,
      content: { "application/json": { schema: flagResultSchema } },
    },
  },
  responses: {
    200: { description: "Result flagged successfully", content: { "application/json": { schema: FlagResultResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/student/courses/results/\:entryId/unflag",
  tags: ["Student"],
  operationId: "unflagOwnResult",
  summary: "Unflag Personal Result",
  description: "Remove an active correction flag from a specific result entry.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
    body: {
      required: true,
      content: { "application/json": { schema: unflagResultSchema } },
    },
  },
  responses: {
    200: { description: "Result unflagged successfully", content: { "application/json": { schema: FlagResultResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ValidationErrorSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/student/results/flags",
  tags: ["Student"],
  operationId: "getStudentFlaggedResults",
  summary: "Get Flagged Results List",
  description: "Retrieve all active result entries flagged by the authenticated student.",
  security: [{ sessionAuth: [] }],
  responses: {
    200: { description: "Flagged results retrieved", content: { "application/json": { schema: StudentFlaggedEntriesResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/student/results/flags/\:entryId",
  tags: ["Student"],
  operationId: "getStudentFlaggedEntryById",
  summary: "Get Flagged Result Details",
  description: "Retrieve full details for a specific result entry flagged by the student.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ entryId: z.string() }),
  },
  responses: {
    200: { description: "Flagged entry details retrieved", content: { "application/json": { schema: StudentFlaggedEntryByIdResponseSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: ErrorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: ErrorResponseSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
  },
});