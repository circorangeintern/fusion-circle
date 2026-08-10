import { z } from "zod";
import { Year, Class } from "@prisma/client";

export const loginValidator = z.object({
    email: z
        .string({
            required_error: "Email is required"
        })
        .email("Invalid email"),

    password: z
        .string({
            required_error: "Password is required"
        })
        .min(8, "Password must be at least 8 characters"),
});

export const CreateAdminValidator = z.object({
    email: z
        .string({
            required_error: "Email is required"
        })
        .email("Invalid email"),
    firstName: z
        .string({
            required_error: "First Name is required"
        }),
    lastName: z
        .string({
            required_error: "Last Name is required"
        }),
    phoneNumber: z
        .string({
            required_error: "Phone Number is required"
        })
        .min(11, "Phone Number must be at least 11 digits")
})


export const forgotPasswordValidator = z.object({
    email: z
        .string({
            required_error: "Email is required"
        })
        .email("Invalid email")
})

export const activateAccountValidator = z.object({
    firstName: z
        .string({ required_error: "First name is required" })
        .min(1, "First name is required"),
    lastName: z
        .string({ required_error: "Last name is required" })
        .min(1, "Last name is required"),
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email"),
    year: z.nativeEnum(Year).optional(),
    class: z.nativeEnum(Class).optional(),
    department: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.year && data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A user cannot have both a year and a class — provide only one.",
            path: ["year"],
        });
    }

    if (!data.year && !data.class && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide at least one of year, class, or department.",
            path: ["year"],
        });
    }

    if (data.year && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required when year is provided.",
            path: ["department"],
        });
    }
});

export const verifyOtpValidator = z.object({
    userId: z
        .number({
            required_error: "User ID is required",
            invalid_type_error: "User ID must be a number"
        })
        .int("User ID must be an integer"),
    otp: z
        .string({
            required_error: "OTP is required"
        })
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only numbers")
});

export const resetPasswordValidator = z.object({
    token: z
        .string({
            required_error: "Reset Token is required"
        }),
    password: z
        .string({
            required_error: "New Password is required"
        })
        .min(8, "Password must be at least 8 characters")


})


export const CreateSchoolValidator = z.object({
    name: z
        .string({
            required_error: "School name is required",
        })
        .min(1, "School name is required"),

    email: z
        .string({
            required_error: "School email is required",
        })
        .email("Invalid school email"),

    website: z
        .string()
        .url("Invalid website URL")
        .optional()
        .or(z.literal("")),

    address: z
        .string({
            required_error: "Address is required",
        })
        .min(1, "Address is required"),

    city: z
        .string({
            required_error: "City is required",
        })
        .min(1, "City is required"),

    state: z
        .string({
            required_error: "State is required",
        })
        .min(1, "State is required"),

    country: z
        .string({
            required_error: "Country is required",
        })
        .min(1, "Country is required"),

    schoolType: z.enum(["UNIVERSITY", "SECONDARY_SCHOOL"], {
        required_error: "School type is required",
    }),

    description: z
        .string()
        .optional()
        .or(z.literal("")),
});


export const UpdateSchoolValidator = z.object({
    name: z
        .string()
        .min(1, "School name is required")
        .optional(),

    email: z
        .string()
        .email("Invalid school email")
        .optional(),

    website: z
        .string()
        .url("Invalid website URL")
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .min(1, "Address is required")
        .optional(),

    city: z
        .string()
        .min(1, "City is required")
        .optional(),

    state: z
        .string()
        .min(1, "State is required")
        .optional(),

    country: z
        .string()
        .min(1, "Country is required")
        .optional(),

    schoolType: z
        .enum(["UNIVERSITY", "SECONDARY_SCHOOL"])
        .optional(),

    description: z
        .string()
        .optional()
        .or(z.literal("")),
});



export const studentRowSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    year: z.nativeEnum(Year).optional(),
    class: z.nativeEnum(Class).optional(),
    department: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.year && data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A student cannot have both a year and a class — provide only one.",
            path: ["year"],
        });
    }

    if (!data.year && !data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A student must have either a year or a class.",
            path: ["year"],
        });
    }

    if (data.year && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required when year is provided.",
            path: ["department"],
        });
    }
});


export const updateStudentSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    year: z.nativeEnum(Year).optional(),
    class: z.nativeEnum(Class).optional(),
    department: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.year && data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A student cannot have both a year and a class — provide only one.",
            path: ["year"],
        });
    }
    if (data.year && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required when year is provided.",
            path: ["department"],
        });
    }
});

export const teacherRowSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    class: z.nativeEnum(Class).optional(),
    studentClass: z.nativeEnum(Class).optional(),
    department: z.string().optional(),
}).transform((data) => ({
    ...data,
    studentClass: data.studentClass ?? data.class,
})).superRefine((data, ctx) => {
    if (data.department && data.studentClass) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A teacher cannot have both a department and a class — provide only one.",
            path: ["department"],
        });
    }

    if (!data.department && !data.studentClass) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A teacher must have either a department or a class.",
            path: ["department"],
        });
    }
});

export const updateTeacherSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    class: z.nativeEnum(Class).optional(),
    studentClass: z.nativeEnum(Class).optional(),
    department: z.string().optional(),
}).transform((data) => ({
    ...data,
    studentClass: data.studentClass ?? data.class,
})).superRefine((data, ctx) => {
    if (data.department && data.studentClass) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A teacher cannot have both a department and a class — provide only one.",
            path: ["department"],
        });
    }
});

export const courseRowSchema = z.object({
    name: z.string().min(1, "Course name is required"),
    year: z.string()
        .transform((val) => val.toUpperCase())
        .pipe(z.nativeEnum(Year))
        .optional(),
    class: z.string()
        .transform((val) => val.toUpperCase())
        .pipe(z.nativeEnum(Class))
        .optional(),
    department: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.year && data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A course cannot have both a year and a class — provide only one.",
            path: ["year"],
        });
    }

    if (!data.year && !data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A course must have either a year or a class.",
            path: ["year"],
        });
    }

    if (data.year && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required when year is provided.",
            path: ["department"],
        });
    }
});

export const updateCourseSchema = z.object({
    name: z.string().min(1).optional(),
    year: z.string().transform((v) => v.toUpperCase()).pipe(z.nativeEnum(Year)).optional(),
    class: z.string().transform((v) => v.toUpperCase()).pipe(z.nativeEnum(Class)).optional(),
    department: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.year && data.class) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A course cannot have both a year and a class — provide only one.",
            path: ["year"],
        });
    }
    if (data.year && !data.department) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required when year is provided.",
            path: ["department"],
        });
    }
});


export const gradingBandSchema = z.object({
    min: z.number().min(0, "Minimum score must be at least 0"),
    max: z.number().max(100, "Maximum score cannot exceed 100"),
    grade: z.string().min(1, "Grade is required"),
    point: z.number().min(0, "Point must be at least 0"),
}).refine((data) => data.min <= data.max, {
    message: "Minimum score cannot be greater than maximum score",
    path: ["min"],
});


export const gradingBandsSchema = z.array(gradingBandSchema)
    .min(1, "At least one grading band is required")
    .refine((bands) => {
        // Check for overlapping ranges
        const sorted = [...bands].sort((a, b) => a.min - b.min);
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].max >= sorted[i + 1].min) {
                return false;
            }
        }
        return true;
    }, {
        message: "Grading bands cannot have overlapping ranges",
    })
    .refine((bands) => {
        const sorted = [...bands].sort((a, b) => a.min - b.min);
        if (sorted[0].min !== 0) {
            return false;
        }
        if (sorted[sorted.length - 1].max !== 100) {
            return false;
        }
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].max + 1 !== sorted[i + 1].min) {
                return false;
            }
        }
        return true;
    }, {
        message: "Grading bands must cover all scores from 0 to 100 without gaps",
    });


export const cgpaConfigSchema = z.object({
    caWeight: z.number().min(0, "CA weight must be at least 0").max(100, "CA weight cannot exceed 100"),
    examWeight: z.number().min(0, "Exam weight must be at least 0").max(100, "Exam weight cannot exceed 100"),
    passMark: z.number().min(0, "Pass mark must be at least 0").max(100, "Pass mark cannot exceed 100"),
}).refine((data) => data.caWeight + data.examWeight === 100, {
    message: "CA weight and exam weight must sum to 100",
    path: ["caWeight"],
});


export const DEFAULT_GRADING_BANDS = [
    { min: 70, max: 100, grade: "A", point: 5 },
    { min: 60, max: 69, grade: "B", point: 4 },
    { min: 50, max: 59, grade: "C", point: 3 },
    { min: 45, max: 49, grade: "D", point: 2 },
    { min: 40, max: 44, grade: "E", point: 1 },
    { min: 0, max: 39, grade: "F", point: 0 },
];

export const DEFAULT_CGPA_CONFIG = {
    caWeight: 30,
    examWeight: 70,
    passMark: 40,
};


export const updateSchoolConfigSchema = z.object({
    gradingBands: gradingBandsSchema.optional(),
    cgpa: cgpaConfigSchema.optional(),
}).refine((data) => data.gradingBands || data.cgpa, {
    message: "At least one field (gradingBands or cgpa) must be provided",
});


export const getStudentCoursesQuerySchema = z.object({
  year: z.nativeEnum(Year).optional(),
  class: z.nativeEnum(Class).optional(),
})
.superRefine((data, ctx) => {
  const hasYear = data.year !== undefined;
  const hasClass = data.class !== undefined;

  // Case 1: Both year and class provided (invalid)
  if (hasYear && hasClass) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "You cannot filter by both year and class simultaneously. Please provide only one.",
      path: ["year"],
    });
    return;
  }

  // Case 2: Neither year nor class provided (invalid)
  if (!hasYear && !hasClass) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either year or class must be provided",
      path: ["year"],
    });
  }
});


export const registerCoursesSchema = z.object({
  courseIds: z.array(
    z.number().int().positive("Course ID must be a positive integer")
  ).min(1, "At least one course must be selected"),
});



export const getCourseStudentsQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  year: z.nativeEnum(Year).optional(),
  class: z.nativeEnum(Class).optional(),
});


export const resultEntrySchema = z.object({
  studentId: z.number().int().positive("Student ID must be a positive integer"),
  caScore: z.number().min(0, "CA score must be at least 0").max(100, "CA score cannot exceed 100"),
  examScore: z.number().min(0, "Exam score must be at least 0").max(100, "Exam score cannot exceed 100"),
}).refine((data) => (data.caScore + data.examScore) <= 100, {
  message: "CA score + Exam score cannot exceed 100",
  path: ["caScore"],
});


export const bulkUploadResultsSchema = z.object({
  results: z.array(resultEntrySchema).min(1, "At least one result must be provided"),
});


export const updateResultEntrySchema = z.object({
  caScore: z.number().min(0, "CA score must be at least 0").max(100, "CA score cannot exceed 100").optional(),
  examScore: z.number().min(0, "Exam score must be at least 0").max(100, "Exam score cannot exceed 100").optional(),
  flag: z.enum(['FLAGGED', 'NOT_FLAGGED']).optional(),
}).refine((data) => data.caScore || data.examScore || data.flag, {
  message: "At least one field (caScore, examScore, or flag) must be provided",
});



// Get results query schema
export const getResultsQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  courseId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PASS', 'FAIL']).optional(),
  grade: z.string().optional(),
});

// Flag a result schema
export const flagResultSchema = z.object({
  description: z.string().min(1, "Description is required").max(500, "Description cannot exceed 500 characters"),
});

export type FlagResultInput = z.infer<typeof flagResultSchema>;

// Unflag a result schema
export const unflagResultSchema = z.object({
  description: z.string().optional(),
});

export type UnflagResultInput = z.infer<typeof unflagResultSchema>;

// Get student results query
export const getStudentResultsQuerySchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PASS', 'FAIL']).optional(),
  grade: z.string().optional(),
  flagged: z.coerce.boolean().optional(),
});

export type GetStudentResultsQueryInput = z.infer<typeof getStudentResultsQuerySchema>;
export type UpdateResultEntryInput = z.infer<typeof updateResultEntrySchema>;
export type BulkUploadResultsInput = z.infer<typeof bulkUploadResultsSchema>;
export type GetResultsQueryInput = z.infer<typeof getResultsQuerySchema>;
export type GetCourseStudentsQueryInput = z.infer<typeof getCourseStudentsQuerySchema>;
export type RegisterCoursesInput = z.infer<typeof registerCoursesSchema>;
export type GetStudentCoursesQueryInput = z.infer<typeof getStudentCoursesQuerySchema>;
export const createCourseSchema = courseRowSchema;
export type UpdateSchoolConfigInput = z.infer<typeof updateSchoolConfigSchema>;
export type CourseRowInput = z.infer<typeof courseRowSchema>;
export type StudentRowInput = z.infer<typeof studentRowSchema>;
export type TeacherRowInput = z.infer<typeof teacherRowSchema>;
export type FailedRow = { row: number; data: unknown; reason: string };
export type LoginInput = z.infer<typeof loginValidator>;
export type CreateAdminInput = z.infer<typeof CreateAdminValidator>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordValidator>;
export type resetPasswordInput = z.infer<typeof resetPasswordValidator>;
export type CreateSchoolInput = z.infer<typeof CreateSchoolValidator>;
export type UpdateSchoolInput = z.infer<typeof UpdateSchoolValidator>;