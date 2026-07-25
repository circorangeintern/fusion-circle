import { z } from "zod";

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

    pin: z
        .string({
            required_error: "School PIN is required",
        })
        .min(1, "School PIN is required"),

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


export const updateSchoolValidator = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),

    caWeight: z.number().int().min(0).max(100).optional(),
    examWeight: z.number().int().min(0).max(100).optional(),
}).superRefine((data, ctx) => {
    const hasCa = data.caWeight !== undefined;
    const hasExam = data.examWeight !== undefined;

    if (hasCa !== hasExam) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "caWeight and examWeight must be updated together.",
            path: hasCa ? ["examWeight"] : ["caWeight"],
        });

        return;
    }

    if (hasCa && hasExam && data.caWeight! + data.examWeight! !== 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "caWeight and examWeight must sum to 100.",
            path: ["caWeight"],
        });
    }
});

export type LoginInput = z.infer<typeof loginValidator>;
export type CreateAdminInput = z.infer<typeof CreateAdminValidator>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordValidator>;
export type resetPasswordInput = z.infer<typeof resetPasswordValidator>;
export type CreateSchoolInput = z.infer<typeof CreateSchoolValidator>;
export type updateSchoolInput = z.infer<typeof updateSchoolValidator>;