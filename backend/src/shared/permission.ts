
// import { Role } from "@prisma/client";

// // export enum Role {
// //     SUPER_ADMIN = "super_admin",
// //     ADMIN = "admin",
// //     TEACHER = "teacher",
// //     STUDENT = "student"
// // }



// }

import { Role } from "@prisma/client";
import { permission } from "node:process";

export enum Permission {
    CREATE_ADMIN = "create:admin",
    DELETE_ADMIN = "delete:admin",
    READ_ADMIN = "read:admin",
    LOGOUT_SUPERADMIN = "logout:superadmin",

    CREATE_SCHOOL = "create:school",
    CREATE_STUDENT = "create:student",
    READ_SCHOOL = "read:school",
    UPDATE_SCHOOL = "update:school",

    LOGOUT_USER = "logout:user",
    READ_USER = "read:user",
    UPDATE_USER = "update:user",
    READ_STUDENT = "read:student",
    UPDATE_STUDENT = "update:student",

    CREATE_TEACHER = "create:teacher",
    READ_TEACHER = "read:teacher",
    UPDATE_TEACHER = "update:teacher",

    CREATE_COURSE = "create:course",
    UPDATE_COURSE = "update:course",
    READ_COURSE = "read:course",
    DELETE_COURSE = "delete:course",


    VIEW_TEACHER_COURSES = "view:teacher_courses",
    VIEW_COURSE_STUDENTS = "view:course_students",
    UPLOAD_RESULTS = "upload:results",
    UPDATE_RESULTS = "update:results",
    VIEW_RESULTS = "view:results",

    VIEW_FLAGGED_RESULTS = "view:flagged_results",
    RESOLVE_FLAGGED_RESULTS = "resolve:flagged_results"

}

export const RolePermissions: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: [
        Permission.CREATE_ADMIN,
        Permission.DELETE_ADMIN,
        Permission.READ_ADMIN,
        Permission.LOGOUT_SUPERADMIN,
        Permission.READ_USER
    ],
    [Role.ADMIN]: [
        Permission.CREATE_SCHOOL,
        Permission.UPDATE_SCHOOL,
        Permission.LOGOUT_USER,
        Permission.READ_SCHOOL,
        Permission.CREATE_STUDENT,
        Permission.READ_STUDENT,
        Permission.UPDATE_STUDENT,
        Permission.CREATE_TEACHER,
        Permission.READ_TEACHER,
        Permission.UPDATE_TEACHER,
        Permission.CREATE_COURSE,
        Permission.UPDATE_COURSE,
        Permission.READ_COURSE,
        Permission.DELETE_COURSE,
        Permission.UPDATE_USER
    ],
    [Role.TEACHER]: [
        Permission.LOGOUT_USER,
        Permission.VIEW_TEACHER_COURSES,
        Permission.VIEW_COURSE_STUDENTS,
        Permission.UPLOAD_RESULTS,
        Permission.UPDATE_RESULTS,
        Permission.VIEW_RESULTS,
        Permission.VIEW_FLAGGED_RESULTS,
        Permission.RESOLVE_FLAGGED_RESULTS
    ],
    [Role.STUDENT]: [
        Permission.LOGOUT_USER
    ],
};