import { registry } from "../../contracts/registry";
import { z } from "zod";

import {
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
     activateAccountValidator,
    verifyOtpValidator,
} from "../../shared/validator/validator";

import {
    ErrorResponseSchema,
    ValidationErrorSchema,
} from "../../contracts/schemas/sharedSchema";

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

const LoginResponseSchema = z.object({
    status: z.literal("success"),
    statusCode: z.literal("OK"),
    message: z.string(),

    data: z.object({
        id: z.number(),
        userName: z.string(),
        role: z.string(),
    }),
});

const ForgotPasswordResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("OK"),
    message: z.string(),
    error: z.null(),
});

const ResetPasswordResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("OK"),
    message: z.string(),
    error: z.null(),
});

const ActivateAccountSuccessResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("OK"),
    message: z.string(),
    error: z.null(),
});

const VerifyOtpSuccessResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("OK"),
    message: z.string(),
    error: z.null(),
});
// -----------------------------------------------------------------------------
// Register Schemas
// -----------------------------------------------------------------------------

registry.register("UserLoginRequest", loginValidator);

registry.register("UserLoginResponse", LoginResponseSchema);

registry.register("ForgotPasswordRequest", forgotPasswordValidator);

registry.register("ForgotPasswordResponse", ForgotPasswordResponseSchema);

registry.register("ResetPasswordRequest", resetPasswordValidator);

registry.register("ResetPasswordResponse", ResetPasswordResponseSchema);

registry.register("ErrorResponse", ErrorResponseSchema);

registry.register("ValidationErrorResponse", ValidationErrorSchema);

registry.register(
    "ActivateAccountRequest",
    activateAccountValidator
);

registry.register(
    "VerifyOtpRequest",
    verifyOtpValidator
);

registry.register(
    "ActivateAccountResponse",
    ActivateAccountSuccessResponseSchema
);

registry.register(
    "VerifyOtpResponse",
    VerifyOtpSuccessResponseSchema
);

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/login",

    tags: ["Authentication"],

    operationId: "login",

    summary: "Authenticate User",

    description:
        "Authenticates a user and creates a server-side session.",

    request: {
        body: {
            required: true,

            content: {
                "application/json": {
                    schema: loginValidator,
                },
            },
        },
    },

    responses: {

        200: {
            description: "Login successful",

            content: {
                "application/json": {
                    schema: LoginResponseSchema,
                },
            },
        },

        400: {
            description: "Validation failed",

            content: {
                "application/json": {
                    schema: ValidationErrorSchema,
                },
            },
        },

        401: {
            description: "Invalid credentials",

            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },

        403: {
            description: "Account inactive or deactivated",

            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },

        429: {
            description: "Too many login attempts",
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

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/logout",

    tags: ["Authentication"],

    operationId: "logout",

    summary: "Logout User",

    description:
        "Destroys the authenticated session and clears the session cookie.",

    security: [
        {
            sessionAuth: [],
        },
    ],

    responses: {

        204: {
            description: "Logout successful",
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

// -----------------------------------------------------------------------------
// Forgot Password
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/forgot-password",

    tags: ["Authentication"],

    operationId: "forgotPassword",

    summary: "Request Password Reset",

    description:
        "Generates a password reset token and sends a password reset email if the account exists.",

    request: {

        body: {

            required: true,

            content: {
                "application/json": {
                    schema: forgotPasswordValidator,
                },
            },

        },

    },

    responses: {

        200: {
            description: "Password reset request processed",

            content: {
                "application/json": {
                    schema: ForgotPasswordResponseSchema,
                },
            },
        },

        400: {
            description: "Validation failed",

            content: {
                "application/json": {
                    schema: ValidationErrorSchema,
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

// -----------------------------------------------------------------------------
// Reset Password
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/reset-password",

    tags: ["Authentication"],

    operationId: "resetPassword",

    summary: "Reset Password",

    description:
        "Resets the user's password using a valid password reset token.",

    request: {

        body: {

            required: true,

            content: {
                "application/json": {
                    schema: resetPasswordValidator,
                },
            },

        },

    },

    responses: {

        200: {
            description: "Password reset successful",

            content: {
                "application/json": {
                    schema: ResetPasswordResponseSchema,
                },
            },
        },

        400: {
            description: "Validation failed",

            content: {
                "application/json": {
                    schema: ValidationErrorSchema,
                },
            },
        },

        401: {
            description: "Invalid or expired reset token",

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

// -----------------------------------------------------------------------------
// Activate Account
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/activate-account",

    tags: ["Authentication"],

    operationId: "activateAccount",

    summary: "Activate user account",

    description:
        "Verifies a student's or teacher's profile details. If the supplied information matches an existing account, a one-time activation OTP is sent to the user's registered email address.",

    request: {
        body: {
            required: true,

            content: {
                "application/json": {
                    schema: activateAccountValidator,
                },
            },
        },
    },

    responses: {

        200: {
            description: "Activation OTP sent successfully",

            content: {
                "application/json": {
                    schema: ActivateAccountSuccessResponseSchema,
                },
            },
        },

        400: {
            description: "Validation failed",

            content: {
                "application/json": {
                    schema: ValidationErrorSchema,
                },
            },
        },

        403: {
            description: "User is not permitted to activate this account",

            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },

        404: {
            description: "Matching user profile not found",

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

// -----------------------------------------------------------------------------
// Verify OTP
// -----------------------------------------------------------------------------

registry.registerPath({

    method: "post",

    path: "/auth/verify-otp",

    tags: ["Authentication"],

    operationId: "verifyAccountOtp",

    summary: "Verify activation OTP",

    description:
        "Verifies the activation OTP sent to the user's email address. If successful, the user's account is activated.",

    request: {
        body: {
            required: true,

            content: {
                "application/json": {
                    schema: verifyOtpValidator,
                },
            },
        },
    },

    responses: {

        200: {
            description: "Account activated successfully",

            content: {
                "application/json": {
                    schema: VerifyOtpSuccessResponseSchema,
                },
            },
        },

        400: {
            description: "Invalid request, invalid OTP, expired OTP, or no OTP exists",

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