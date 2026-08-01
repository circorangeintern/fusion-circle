import { registry } from "../../../contracts/registry";
import { z } from "zod";

import {
	CreateSchoolValidator,
	UpdateSchoolValidator,
	studentRowSchema,
	updateStudentSchema,
	teacherRowSchema,
	updateTeacherSchema,
	createCourseSchema,
	updateCourseSchema,
	updateSchoolConfigSchema,
} from "../../../shared/validator/validator";

import {
	ErrorResponseSchema,
	ValidationErrorSchema,
} from "../../../contracts/schemas/sharedSchema";


// ----------------------------
// Schemas
// ----------------------------

const SchoolSchema = z.object({
	id: z.number(),
	pin: z.string(),
	name: z.string(),
	email: z.string().email(),
	website: z.string().nullable().optional(),
	address: z.string(),
	city: z.string(),
	state: z.string(),
	country: z.string(),
	schoolType: z.string(),
	description: z.string().nullable().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	createdById: z.number(),
});

const CreateSchoolResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("CREATED"),
	message: z.string(),
	data: SchoolSchema,
});

const GetSchoolsResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: z.array(SchoolSchema),
});

const UpdateSchoolResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("UPDATED"),
	message: z.string(),
	data: SchoolSchema,
});

// User / Student / Teacher basic schemas used in responses
const UserBaseSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	phoneNumber: z.string().nullable().optional(),
	role: z.string(),
	status: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	schoolId: z.number().nullable().optional(),
});

const StudentProfileSchema = z.object({
	regNo: z.string().nullable().optional(),
	department: z.string().nullable().optional(),
	year: z.string().nullable().optional(),
	class: z.string().nullable().optional(),
});

const StudentResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("CREATED").or(z.literal("OK")),
	message: z.string(),
	data: z.object({
		...UserBaseSchema.shape,
		student: StudentProfileSchema.optional(),
	}),
});

const GetStudentsResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: z.array(z.object({
		...UserBaseSchema.shape,
		...StudentProfileSchema.shape,
	})),
});

const TeacherProfileSchema = z.object({
	department: z.string().nullable().optional(),
	studentClass: z.string().nullable().optional(),
});

const TeacherResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("CREATED").or(z.literal("OK")),
	message: z.string(),
	data: z.object({
		...UserBaseSchema.shape,
		teacher: TeacherProfileSchema.optional(),
	}),
});

const GetTeachersResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: z.array(z.object({
		...UserBaseSchema.shape,
		...TeacherProfileSchema.shape,
	})),
});

const CourseSchema = z.object({
	id: z.number(),
	name: z.string(),
	year: z.string().nullable().optional(),
	class: z.string().nullable().optional(),
	department: z.string().nullable().optional(),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const CreateCourseResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("CREATED"),
	message: z.string(),
	data: CourseSchema,
});

const BulkUploadFailedRowSchema = z.object({
	row: z.number(),
	data: z.any(),
	reason: z.string(),
});

const BulkUploadResponseSchema = z.object({
	success: z.boolean(),
	code: z.string(),
	message: z.string(),
	data: z.object({
		totalRows: z.number(),
		inserted: z.number(),
		failed: z.number(),
		interrupted: z.boolean(),
		failedRows: z.array(BulkUploadFailedRowSchema).optional(),
	}),
});

const BulkUploadStudentsRequestSchema = z.object({
	resultTrackStudent: z.any().openapi({ type: "string", format: "binary" }),
});

const BulkUploadTeachersRequestSchema = z.object({
	resultTrackTeacher: z.any().openapi({ type: "string", format: "binary" }),
});

const BulkUploadCoursesRequestSchema = z.object({
	resultTrackCourse: z.any().openapi({ type: "string", format: "binary" }),
});

const GetCoursesResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: z.array(CourseSchema),
});

const ActivateUserResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: z.object({
		id: z.number(),
		email: z.string().email(),
		firstName: z.string(),
		lastName: z.string(),
		role: z.string(),
		status: z.string(),
		updatedAt: z.string(),
	}),
});

const SchoolConfigSchema = z.object({
	id: z.number(),
	schoolId: z.number(),
	gradingBands: z.any(),
	cgpa: z.any(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const GetSchoolConfigResponseSchema = z.object({
	success: z.literal(true),
	code: z.literal("OK"),
	message: z.string(),
	data: SchoolConfigSchema,
});


// ----------------------------
// Register Schemas
// ----------------------------

registry.register("CreateSchoolRequest", CreateSchoolValidator);
registry.register("CreateSchoolResponse", CreateSchoolResponseSchema);

registry.register("GetSchoolsResponse", GetSchoolsResponseSchema);

registry.register("UpdateSchoolRequest", UpdateSchoolValidator);
registry.register("UpdateSchoolResponse", UpdateSchoolResponseSchema);

registry.register("CreateStudentRequest", studentRowSchema);
registry.register("CreateStudentResponse", StudentResponseSchema);
registry.register("GetStudentsResponse", GetStudentsResponseSchema);
registry.register("UpdateStudentRequest", updateStudentSchema);

registry.register("CreateTeacherRequest", teacherRowSchema);
registry.register("CreateTeacherResponse", TeacherResponseSchema);
registry.register("GetTeachersResponse", GetTeachersResponseSchema);
registry.register("UpdateTeacherRequest", updateTeacherSchema);

registry.register("CreateCourseRequest", createCourseSchema);
registry.register("CreateCourseResponse", CreateCourseResponseSchema);
registry.register("GetCoursesResponse", GetCoursesResponseSchema);
registry.register("UpdateCourseRequest", updateCourseSchema);

registry.register("BulkUploadStudentsRequest", BulkUploadStudentsRequestSchema);
registry.register("BulkUploadTeachersRequest", BulkUploadTeachersRequestSchema);
registry.register("BulkUploadCoursesRequest", BulkUploadCoursesRequestSchema);
registry.register("BulkUploadResponse", BulkUploadResponseSchema);

registry.register("ActivateUserResponse", ActivateUserResponseSchema);

registry.register("SchoolConfig", SchoolConfigSchema);
registry.register("GetSchoolConfigResponse", GetSchoolConfigResponseSchema);

registry.register("ErrorResponse", ErrorResponseSchema);
registry.register("ValidationErrorResponse", ValidationErrorSchema);


// ----------------------------
// Register Paths
// ----------------------------

registry.registerPath({
	method: "post",
	path: "/admin/schools",
	tags: ["Admin"],
	operationId: "createSchool",
	summary: "Create School",
	description: "Creates a new school and associates it with the authenticated admin.",
	security: [{ sessionAuth: [] }],
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: CreateSchoolValidator },
			},
		},
	},
	responses: {
		201: { description: "School created", content: { "application/json": { schema: CreateSchoolResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "patch",
	path: "/admin/schools/:id",
	tags: ["Admin"],
	operationId: "updateSchool",
	summary: "Update School",
	description: "Updates a school managed by the authenticated admin.",
	security: [{ sessionAuth: [] }],
	request: {
		params: z.object({ id: z.string() }),
		body: { required: true, content: { "application/json": { schema: UpdateSchoolValidator } } },
	},
	responses: {
		200: { description: "School updated", content: { "application/json": { schema: UpdateSchoolResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/schools",
	tags: ["Admin"],
	operationId: "getSchools",
	summary: "Get Schools",
	description: "Retrieve schools created by the authenticated admin.",
	security: [{ sessionAuth: [] }],
	responses: {
		200: { description: "Schools retrieved", content: { "application/json": { schema: GetSchoolsResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// School config
registry.registerPath({
	method: "get",
	path: "/admin/schools/config",
	tags: ["Admin"],
	operationId: "getSchoolConfig",
	summary: "Get School Config",
	description: "Get or create default school configuration for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	responses: {
		200: { description: "Config retrieved", content: { "application/json": { schema: GetSchoolConfigResponseSchema } } },
		400: { description: "Bad request", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "put",
	path: "/admin/schools/config",
	tags: ["Admin"],
	operationId: "updateSchoolConfig",
	summary: "Update School Config",
	description: "Update the school configuration for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { body: { required: true, content: { "application/json": { schema: updateSchoolConfigSchema } } } },
	responses: {
		200: { description: "Config updated", content: { "application/json": { schema: GetSchoolConfigResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// Students
registry.registerPath({
	method: "post",
	path: "/admin/students",
	tags: ["Admin"],
	operationId: "createStudent",
	summary: "Create Student",
	description: "Create a student for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { body: { required: true, content: { "application/json": { schema: studentRowSchema } } } },
	responses: {
		201: { description: "Student created", content: { "application/json": { schema: StudentResponseSchema } } },
		400: { description: "Validation failed or bad request", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/admin/students/bulk",
	tags: ["Admin"],
	operationId: "bulkUploadStudents",
	summary: "Bulk Upload Students",
	description: "Upload a CSV file containing students for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: {
		body: {
			description: "Field name: resultTrackStudent. CSV file (UTF-8, comma separated). Expected headers examples:\n- University: firstName,lastName,email,phoneNumber,year,department\n- Secondary: firstName,lastName,email,phoneNumber,studentClass\nAccepts either (department + year) for university schools, or only `studentClass` for secondary schools. Fields may be quoted.",
			required: true,
			content: {
				"multipart/form-data": {
					schema: BulkUploadStudentsRequestSchema,
				},
			},
		},
	},
	responses: {
		200: { description: "Bulk upload processed", content: { "application/json": { schema: BulkUploadResponseSchema } } },
		207: { description: "Partial failure", content: { "application/json": { schema: BulkUploadResponseSchema } } },
		400: { description: "Validation failed or bad request", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/students",
	tags: ["Admin"],
	operationId: "getStudents",
	summary: "Get Students",
	description: "Retrieve students for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	responses: {
		200: { description: "Students retrieved", content: { "application/json": { schema: GetStudentsResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/students/:id",
	tags: ["Admin"],
	operationId: "getStudentById",
	summary: "Get Student by ID",
	description: "Retrieve a student by id for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }) },
	responses: {
		200: { description: "Student retrieved", content: { "application/json": { schema: StudentResponseSchema } } },
		400: { description: "Invalid ID", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "patch",
	path: "/admin/students/:id",
	tags: ["Admin"],
	operationId: "updateStudent",
	summary: "Update Student",
	description: "Update a student's data for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }), body: { required: true, content: { "application/json": { schema: updateStudentSchema } } } },
	responses: {
		200: { description: "Student updated", content: { "application/json": { schema: StudentResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// Teachers
registry.registerPath({
	method: "post",
	path: "/admin/teachers",
	tags: ["Admin"],
	operationId: "createTeacher",
	summary: "Create Teacher",
	description: "Create a teacher for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { body: { required: true, content: { "application/json": { schema: teacherRowSchema } } } },
	responses: {
		201: { description: "Teacher created", content: { "application/json": { schema: TeacherResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/admin/teachers/bulk",
	tags: ["Admin"],
	operationId: "bulkUploadTeachers",
	summary: "Bulk Upload Teachers",
	description: "Upload a CSV file containing teachers for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: {
		body: {
			description: "CSV file (UTF-8, comma separated). Expected headers (example in development/teacher.csv): firstName,lastName,email,phoneNumber,department,year. For secondary schools use `studentClass` instead of (department+year). The import accepts either (department + year) or `studentClass`. Fields may be quoted.",
			required: true,
			content: {
				"multipart/form-data": {
					schema: BulkUploadTeachersRequestSchema,

				},
			},
		},
	},
	responses: {
		200: { description: "Bulk upload processed", content: { "application/json": { schema: BulkUploadResponseSchema } } },
		207: { description: "Partial failure", content: { "application/json": { schema: BulkUploadResponseSchema } } },
		400: { description: "Validation failed or bad request", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/teachers",
	tags: ["Admin"],
	operationId: "getTeachers",
	summary: "Get Teachers",
	description: "Retrieve teachers for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	responses: {
		200: { description: "Teachers retrieved", content: { "application/json": { schema: GetTeachersResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/teachers/:id",
	tags: ["Admin"],
	operationId: "getTeacherById",
	summary: "Get Teacher by ID",
	description: "Retrieve a teacher by id for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }) },
	responses: {
		200: { description: "Teacher retrieved", content: { "application/json": { schema: TeacherResponseSchema } } },
		400: { description: "Invalid ID", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "patch",
	path: "/admin/teachers/:id",
	tags: ["Admin"],
	operationId: "updateTeacher",
	summary: "Update Teacher",
	description: "Update a teacher's data for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }), body: { required: true, content: { "application/json": { schema: updateTeacherSchema } } } },
	responses: {
		200: { description: "Teacher updated", content: { "application/json": { schema: TeacherResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// Courses
registry.registerPath({
	method: "post",
	path: "/admin/courses",
	tags: ["Admin"],
	operationId: "createCourse",
	summary: "Create Course",
	description: "Create a course for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { body: { required: true, content: { "application/json": { schema: createCourseSchema } } } },
	responses: {
		201: { description: "Course created", content: { "application/json": { schema: CreateCourseResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/admin/courses/bulk",
	tags: ["Admin"],
	operationId: "bulkUploadCourses",
	summary: "Bulk Upload Courses",
	description: "Upload a CSV file containing courses for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: {
		body: {
			description: "Field name: resultTrackCourse. CSV file (UTF-8, comma separated). Expected headers examples:\n- University: name,year,department\n- Secondary: name,studentClass\nThe import accepts either (year + department) for university schools, or only `studentClass` for secondary schools. Fields may be quoted.",
			required: true,
			content: {
				"multipart/form-data": {
					schema: BulkUploadCoursesRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Bulk upload processed successfully.",
			content: {
				"application/json": {
					schema: BulkUploadResponseSchema,
				},
			},
		},
		207: {
			description: "Bulk upload completed with partial failures.",
			content: {
				"application/json": {
					schema: BulkUploadResponseSchema,
				},
			},
		},
		400: {
			description: "Validation failed or bad request.",
			content: {
				"application/json": {
					schema: ValidationErrorSchema,
				},
			},
		},
		401: {
			description: "Unauthorized.",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error.",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/courses",
	tags: ["Admin"],
	operationId: "getCourses",
	summary: "Get Courses",
	description: "Retrieve all courses for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	responses: {
		200: {
			description: "Courses retrieved successfully.",
			content: {
				"application/json": {
					schema: GetCoursesResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/admin/courses/{id}",
	tags: ["Admin"],
	operationId: "getCourseById",
	summary: "Get Course by ID",
	description: "Retrieve a course by ID for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			description: "Course retrieved successfully.",
			content: {
				"application/json": {
					schema: CreateCourseResponseSchema,
				},
			},
		},
		400: {
			description: "Invalid course ID.",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Course not found.",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
registry.registerPath({
	method: "patch",
	path: "/admin/courses/:id",
	tags: ["Admin"],
	operationId: "updateCourse",
	summary: "Update Course",
	description: "Update a course for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }), body: { required: true, content: { "application/json": { schema: updateCourseSchema } } } },
	responses: {
		200: { description: "Course updated", content: { "application/json": { schema: CreateCourseResponseSchema } } },
		400: { description: "Validation failed", content: { "application/json": { schema: ValidationErrorSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "delete",
	path: "/admin/courses/:id",
	tags: ["Admin"],
	operationId: "deleteCourse",
	summary: "Delete Course",
	description: "Delete a course for the authenticated admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }) },
	responses: {
		200: { description: "Course deleted", content: { "application/json": { schema: CreateCourseResponseSchema } } },
		400: { description: "Invalid ID", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// Course teachers
registry.registerPath({
	method: "put",
	path: "/admin/courses/:courseId/teachers/:teacherId",
	tags: ["Admin"],
	operationId: "addTeacherToCourse",
	summary: "Add Teacher To Course",
	description: "Associate a teacher with a course.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ courseId: z.string(), teacherId: z.string() }) },
	responses: {
		200: { description: "Teacher added", content: { "application/json": { schema: CreateCourseResponseSchema } } },
		400: { description: "Invalid IDs", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "delete",
	path: "/admin/courses/:courseId/teachers/:teacherId",
	tags: ["Admin"],
	operationId: "removeTeacherFromCourse",
	summary: "Remove Teacher From Course",
	description: "Remove association between a teacher and a course.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ courseId: z.string(), teacherId: z.string() }) },
	responses: {
		200: { description: "Teacher removed", content: { "application/json": { schema: CreateCourseResponseSchema } } },
		400: { description: "Invalid IDs", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

// Activate / Deactivate user
registry.registerPath({
	method: "patch",
	path: "/admin/users/:id/activate",
	tags: ["Admin"],
	operationId: "activateUser",
	summary: "Activate User",
	description: "Activate a user in the admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }) },
	responses: {
		200: { description: "User activated", content: { "application/json": { schema: ActivateUserResponseSchema } } },
		400: { description: "Invalid ID", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

registry.registerPath({
	method: "patch",
	path: "/admin/users/:id/deactivate",
	tags: ["Admin"],
	operationId: "deactivateUser",
	summary: "Deactivate User",
	description: "Deactivate a user in the admin's school.",
	security: [{ sessionAuth: [] }],
	request: { params: z.object({ id: z.string() }) },
	responses: {
		200: { description: "User deactivated", content: { "application/json": { schema: ActivateUserResponseSchema } } },
		400: { description: "Invalid ID", content: { "application/json": { schema: ErrorResponseSchema } } },
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponseSchema } } },
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponseSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
		500: { description: "Internal server error", content: { "application/json": { schema: ErrorResponseSchema } } },
	},
});

