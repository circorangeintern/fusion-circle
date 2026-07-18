import { registry } from "../../contracts/registry";
import { z } from "zod";
import {
    loginValidator,
    CreateAdminValidator,
} from "../../shared/validator/validator";

import {
    ErrorResponseSchema,
    ValidationErrorSchema,
} from "../../contracts/schemas/sharedSchema";


// ----------------------------
// Schemas
// ----------------------------

const LoginResponseSchema = z.object({
    status: z.literal("success"),
    statusCode: z.literal(200),
    message: z.string(),

    data: z.object({
        id: z.string(),
        userName: z.string(),
        role: z.string(),
    }),
});


const CreateAdminResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("CREATED"),
    message: z.string(),

    data: z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        temporaryPassword: z.string(),
        role: z.string(),
        status: z.string(),
    }),
});


const DeactivateAdminParamsSchema = z.object({
    id: z.string(),
});


const AdminSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const GetAdminsResponseSchema = z.object({
    status: z.literal("success"),
    statusCode: z.literal(200),
    message: z.string(),

    data: z.array(AdminSchema),
});

const GetAdminResponseSchema = z.object({
    status: z.literal("success"),
    statusCode: z.literal(200),
    message: z.string(),

    data: AdminSchema,
});

const AdminIdParamsSchema = z.object({
    id: z.string(),
});


// ----------------------------
// Register Schemas
// ----------------------------

registry.register(
    "SuperAdminLoginRequest",
    loginValidator
);

registry.register(
    "SuperAdminLoginResponse",
    LoginResponseSchema
);

registry.register(
    "CreateAdminRequest",
    CreateAdminValidator
);

registry.register(
    "CreateAdminResponse",
    CreateAdminResponseSchema
);

registry.register(
    "DeactivateAdminParams",
    DeactivateAdminParamsSchema
);

registry.register(
    "Admin",
    AdminSchema
);

registry.register(
    "GetAdminsResponse",
    GetAdminsResponseSchema
);

registry.register(
    "GetAdminResponse",
    GetAdminResponseSchema
);

registry.register(
    "AdminIdParams",
    AdminIdParamsSchema
);

// ----------------------------
// Login
// ----------------------------

registry.registerPath({

    method: "post",

    path: "/superAdmin/login",

    tags: ["Super Admin"],

    operationId: "superAdminLogin",

    summary: "Authenticate a Super Admin",

    description:
        "Authenticates a Super Admin and creates a server-side session.",


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



// ----------------------------
// Create Admin
// ----------------------------

registry.registerPath({

    method: "post",

    path: "/superAdmin/admin",

    tags: ["Super Admin"],

    operationId: "createAdmin",

    summary: "Create Admin Account",

    description:
        "Creates a new administrator account. Requires Super Admin permission.",


    security: [
        {
            sessionAuth: [],
        },
    ],


    request: {

        body: {
            required: true,

            content: {
                "application/json": {
                    schema: CreateAdminValidator,
                },
            },
        },

    },


    responses: {

        201: {
            description: "Admin created successfully",

            content: {
                "application/json": {
                    schema: CreateAdminResponseSchema,
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
            description: "Unauthorized",

            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },


        403: {
            description: "Forbidden",

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



// ----------------------------
// Deactivate Admin
// ----------------------------

registry.registerPath({

    method: "patch",

    path: "/superAdmin/admin/{id}",

    tags: ["Super Admin"],

    operationId: "deactivateAdmin",

    summary: "Deactivate Admin Account",

    description:
        "Deactivates an administrator account by ID. Requires Super Admin permission.",


    security: [
        {
            sessionAuth: [],
        },
    ],


    request: {

        params: DeactivateAdminParamsSchema,

    },


    responses: {

        204: {
            description: "Admin deactivated successfully",
        },


        400: {
            description: "Invalid admin ID or admin not found",

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


        403: {
            description: "Forbidden",

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


// ----------------------------
// Get All Admins
// ----------------------------

registry.registerPath({

    method: "get",

    path: "/superAdmin/admins",

    tags: ["Super Admin"],

    operationId: "getAdmins",

    summary: "Retrieve all administrators",

    description:
        "Returns a list of all administrator accounts.",

    security: [
        {
            sessionAuth: [],
        },
    ],

    responses: {

        200: {
            description: "Admins retrieved successfully",

            content: {
                "application/json": {
                    schema: GetAdminsResponseSchema,
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

        403: {
            description: "Forbidden",

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

// ----------------------------
// Get Admin By Id
// ----------------------------

registry.registerPath({

    method: "get",

    path: "/superAdmin/admins/{id}",

    tags: ["Super Admin"],

    operationId: "getAdminById",

    summary: "Retrieve an administrator",

    description:
        "Returns an administrator by ID.",

    security: [
        {
            sessionAuth: [],
        },
    ],

    request: {

        params: AdminIdParamsSchema,

    },

    responses: {

        200: {
            description: "Admin retrieved successfully",

            content: {
                "application/json": {
                    schema: GetAdminResponseSchema,
                },
            },
        },

        400: {
            description: "Invalid admin ID",

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

        403: {
            description: "Forbidden",

            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },

        404: {
            description: "Admin not found",

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

// ----------------------------
// Logout
// ----------------------------

registry.registerPath({

    method: "post",

    path: "/superAdmin/logout",

    tags: ["Super Admin"],

    operationId: "logoutSuperAdmin",

    summary: "Logout Super Admin",

    description:
        "Destroys the current authenticated session and clears the session cookie.",

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