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

export type LoginInput = z.infer<typeof loginValidator>;
export type CreateAdminInput = z.infer<typeof CreateAdminValidator>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordValidator>;
export type resetPasswordInput = z.infer<typeof resetPasswordValidator>;