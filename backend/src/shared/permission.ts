
// import { Role } from "@prisma/client";

// // export enum Role {
// //     SUPER_ADMIN = "super_admin",
// //     ADMIN = "admin",
// //     TEACHER = "teacher",
// //     STUDENT = "student"
// // }



// }

import { Role } from "@prisma/client";

export enum Permission {
    CREATE_ADMIN = "create:admin",
    DELETE_ADMIN = "delete:admin",
    READ_ADMIN = "read:admin",
    LOGOUT_SUPERADMIN = "logout:superadmin",

    CREATE_SCHOOL = "create:school",
    UPDATE_SCHOOL = "update:school",
}

export const RolePermissions: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: [
        Permission.CREATE_ADMIN,
        Permission.DELETE_ADMIN,
        Permission.READ_ADMIN,
        Permission.LOGOUT_SUPERADMIN
    ],
    [Role.ADMIN]: [
        Permission.CREATE_SCHOOL,
        Permission.UPDATE_SCHOOL,
    ],
    [Role.TEACHER]: [
        // whatever teachers can do
    ],
    [Role.STUDENT]: [
        // whatever a base user can do
    ],
};