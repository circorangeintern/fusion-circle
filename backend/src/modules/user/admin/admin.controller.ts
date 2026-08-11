import { Response, Request, NextFunction, response } from "express";
import { prisma } from "../../../shared/prisma/prisma";
import { AccountStatus ,NotificationType, Prisma} from "@prisma/client";
import { logAudit } from "../../../utils/auditLogger";
import { createUniqueSchoolPin } from "../../../utils/passwordGenerator";
import {syncDepartments} from "../../../utils/syncDepartment";
import {
    createSchoolService, updateSchoolService,
    readSchoolService, processStudentBatch,
    createStudentService, getStudentsService,
    validateStudentForSchoolType, validateStudentUpdateForSchoolType,
    processTeacherBatch, createTeacherService, getTeachersService,
    validateTeacherForSchoolType, validateTeacherUpdateForSchoolType,
    processCourseBatch, validateCourseForSchoolType, createCourseService,
    getCoursesService
} from "./admin.services"
import { Role } from "@prisma/client";
import { success } from "zod/v4";
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { upload } from "../../../shared/middlewares/csvFilter"
import { getObjectById, updateObject } from "../../../shared/prisma/repoLayer"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { UpdateSchoolConfigInput } from "../../../shared/validator/validator";
import { createNotification } from '../../../shared/notificationService';




export const createSchoolController = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.user?.schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You already manage a school.",
                error: null,
            });
        }

        const pin = await createUniqueSchoolPin();


        const userId = req.user?.id;

        const school = await createSchoolService(req.body, { userId, pin })

        // Audit Log
        await logAudit({
            userId,
            action: "CREATE_SCHOOL",
            entityType: "SCHOOL",
            entityId: school.id,
            details: {
                name: school.name,
                pin: pin,
                email: school.email,
                address: school.address,
                city: school.city,
                state: school.state,
                country: school.country,
                schoolType: school.schoolType,
                description: school.description,
            },
        });

        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "School created successfully",
            data: school,
        });
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "createSchoolController failed");

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null
        })
    }
};



export const readSchoolController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id
        const result = await readSchoolService(userId);

        if (!result.success) {
            const { statusCode, ...response } = result;
            return res.status(statusCode).json(response);
        }

        try {
            await logAudit({
                userId: req.user?.id,
                action: "READ_SCHOOL",
                entityType: "SCHOOL",
                entityId: result.data.id,
                details: result.data,
            });
        } catch (error) {
            req.log.error({ err: error, userId: req.user?.id }, "Failed to write audit log for readSchoolController");
        }
        return res.status(200).json(result);
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "readSchoolController failed");

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null
        })
    }
};

export const updateSchoolController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schoolId = Number(req.params.id);
        const userSchoolId = Number(req.user?.schoolId);


        if (!userSchoolId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You do not manage a school.",
                error: null,
            });
        }

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "School ID is required.",
                error: null,
            });
        }

        if (schoolId !== userSchoolId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You do not manage this school.",
                error: null,
            });
        }





        const result = await updateSchoolService(schoolId, req.body);

        if (!result.success) {
            const { statusCode, ...response } = result;
            return res.status(statusCode).json(response);
        }

        try {
            await logAudit({
                userId: req.user?.id,
                action: "UPDATE_SCHOOL",
                entityType: "SCHOOL",
                entityId: schoolId,
                details: result.data,
            });
        } catch (error) {
            req.log.error({ err: error, userId: req.user?.id }, "Failed to write audit log for updateSchoolController");
        }

        return res.status(200).json(result);
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "updateSchoolController failed");
        next(error);
    }
};

const BATCH_SIZE = 1000;

export const CreateBulkStudentsController = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "No file uploaded.",
            data: null,
        });
    }

    const schoolId = req.user?.schoolId;
    if (!schoolId) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "You do not manage a school.",
            data: null,
        });
    }

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolType: true },
    });

    if (!school) {
        return res.status(404).json({
            success: false,
            code: "NOT_FOUND",
            message: "School not found.",
            data: null,
        });
    }

    const seenEmails = new Set<string>();

    let currentBatch: unknown[] = [];
    let rowsSeenSoFar = 0;
    let totalInserted = 0;
    let allFailed: Array<{ row: number; data: unknown; reason: string }> = [];
    let fatalError: unknown = null;

    try {
        const parser = parse({ columns: true, skip_empty_lines: true, trim: true, bom: true, delimiter: "," });
        const parserStream = Readable.from(req.file.buffer).pipe(parser);

        for await (const row of parserStream) {
            currentBatch.push(row);
            rowsSeenSoFar++;

            if (currentBatch.length === BATCH_SIZE) {
                const startingRow = rowsSeenSoFar - currentBatch.length + 2;
                const result = await processStudentBatch(currentBatch, startingRow, seenEmails, schoolId, school.schoolType);
                totalInserted += result.inserted;
                allFailed.push(...result.failed);
                currentBatch = [];
            }
        }

        if (currentBatch.length > 0) {
            const startingRow = rowsSeenSoFar - currentBatch.length + 2;
            const result = await processStudentBatch(currentBatch, startingRow, seenEmails, schoolId, school.schoolType);
            totalInserted += result.inserted;
            allFailed.push(...result.failed);
        }
    } catch (error) {
        fatalError = error;
        req.log.error({ error, rowsSeenSoFar, totalInserted }, "Bulk upload interrupted mid-processing");
    }

    logAudit({
        userId: req.user!.id,
        action: "BULK_UPLOAD_STUDENTS",
        entityType: "SCHOOL",
        entityId: schoolId,
        details: {
            totalRows: rowsSeenSoFar,
            inserted: totalInserted,
            failed: allFailed.length,
            interrupted: !!fatalError,
        },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

  syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
    return res.status(fatalError ? 207 : 200).json({
        success: !fatalError,
        code: fatalError ? "PARTIAL_FAILURE" : "OK",
        message: fatalError
            ? `Processing stopped early after ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`
            : `Processed ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`,
        data: {
            totalRows: rowsSeenSoFar,
            inserted: totalInserted,
            failed: allFailed.length,
            interrupted: !!fatalError,
            ...(allFailed.length > 0 && { failedRows: allFailed }),
        },
    });
};




export const createStudentController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user?.schoolId;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateStudentForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
        if (existing) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "A user with this email already exists.",
                data: null,
            });
        }

        const { user, student } = await createStudentService(req.body, schoolId);

        logAudit({
            userId: req.user!.id,
            action: "CREATE_STUDENT",
            entityType: "USER",
            entityId: user.id,
            details: { email: user.email },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "Student created successfully.",
            data: { ...user, passwordHash: undefined, student },
        });
    } catch (error: any) {
        req.log.error({ error }, "createStudentController failed");
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: error.message || "Something went wrong. Please try again.",
            data: null,
        });
    }
};


export const getStudentsController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user!.schoolId!;
        const students = await getStudentsService(schoolId);

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_STUDENTS",
            entityType: "SCHOOL",
            entityId: schoolId,
            details: {
                totalStudents: students.length,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Students retrieved successfully.",
            data: students,
        });
    } catch (error) {
        req.log.error({ error }, "getStudentsController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const getStudentByIdController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);

        if (isNaN(studentId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid student ID.",
                data: null,
            });
        }

        const student = await prisma.user.findUnique({
            where: { id: studentId, role: Role.STUDENT },
            include: {
                student: {
                    select: {
                        regNo: true,
                        year: true,
                        class: true,
                        department: true,
                    },
                },
            },
        });

        if (!student || student.schoolId !== req.user!.schoolId) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Student not found.",
                data: null,
            });
        }

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_STUDENT",
            entityType: "STUDENT",
            entityId: studentId,
            details: {
                email: student.email,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        const { passwordHash, student: studentProfile, ...userFields } = student;

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Student retrieved successfully.",
            data: {
                ...userFields,
                ...studentProfile,
            },
        });
    } catch (error) {
        req.log.error({ error }, "getStudentByIdController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};


export const updateStudentController = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.id);

        if (isNaN(studentId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid student ID.",
                data: null,
            });
        }

        const existing = await getObjectById(prisma.user, studentId);

        if (!existing || existing.schoolId !== req.user!.schoolId) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Student not found.",
                data: null,
            });
        }

        const schoolId = req.user?.schoolId;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateStudentUpdateForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const { year, class: studentClass, department, ...userFields } = req.body;

        const updated = await updateObject(
            prisma.user,
            { id: studentId },
            userFields
        );

        if (year !== undefined || studentClass !== undefined || department !== undefined) {
            const studentUpdateData: { year?: any; class?: any; department?: any } = {};
            if (school.schoolType === "UNIVERSITY") {
                if (year !== undefined) studentUpdateData.year = year;
                if (department !== undefined) studentUpdateData.department = department;
            } else if (school.schoolType === "SECONDARY_SCHOOL") {
                if (studentClass !== undefined) studentUpdateData.class = studentClass;
            }

            if (Object.keys(studentUpdateData).length > 0) {
                await updateObject(
                    prisma.student,
                    { userId: studentId },
                    studentUpdateData
                );
            }
        }

        logAudit({
            userId: req.user!.id,
            action: "UPDATE_STUDENT",
            entityType: "USER",
            entityId: studentId,
            details: req.body,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        const { passwordHash, ...safeUpdated } = updated;
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Student updated successfully.",
            data: safeUpdated,
        });
    } catch (error) {
        req.log.error({ error }, "updateStudentController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const CreateBulkTeachersController = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "No file uploaded.",
            data: null,
        });
    }

    const schoolId = req.user?.schoolId;
    if (!schoolId) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "You do not manage a school.",
            data: null,
        });
    }

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolType: true },
    });

    if (!school) {
        return res.status(404).json({
            success: false,
            code: "NOT_FOUND",
            message: "School not found.",
            data: null,
        });
    }

    const seenEmails = new Set<string>();

    let currentBatch: unknown[] = [];
    let rowsSeenSoFar = 0;
    let totalInserted = 0;
    let allFailed: Array<{ row: number; data: unknown; reason: string }> = [];
    let fatalError: unknown = null;

    try {
        const parser = parse({ columns: true, skip_empty_lines: true, trim: true, bom: true, delimiter: "," });
        const parserStream = Readable.from(req.file.buffer).pipe(parser);

        for await (const row of parserStream) {
            currentBatch.push(row);
            rowsSeenSoFar++;

            if (currentBatch.length === BATCH_SIZE) {
                const startingRow = rowsSeenSoFar - currentBatch.length + 2;
                const result = await processTeacherBatch(currentBatch, startingRow, seenEmails, schoolId, school.schoolType);
                totalInserted += result.inserted;
                allFailed.push(...result.failed);
                currentBatch = [];
            }
        }

        if (currentBatch.length > 0) {
            const startingRow = rowsSeenSoFar - currentBatch.length + 2;
            const result = await processTeacherBatch(currentBatch, startingRow, seenEmails, schoolId, school.schoolType);
            totalInserted += result.inserted;
            allFailed.push(...result.failed);
        }
    } catch (error) {
        fatalError = error;
        req.log.error({ error, rowsSeenSoFar, totalInserted }, "Bulk teacher upload interrupted mid-processing");
    }

    logAudit({
        userId: req.user!.id,
        action: "BULK_UPLOAD_TEACHERS",
        entityType: "SCHOOL",
        entityId: schoolId,
        details: {
            totalRows: rowsSeenSoFar,
            inserted: totalInserted,
            failed: allFailed.length,
            interrupted: !!fatalError,
        },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
    return res.status(fatalError ? 207 : 200).json({
        success: !fatalError,
        code: fatalError ? "PARTIAL_FAILURE" : "OK",
        message: fatalError
            ? `Processing stopped early after ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`
            : `Processed ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`,
        data: {
            reason: fatalError,
            totalRows: rowsSeenSoFar,
            inserted: totalInserted,
            failed: allFailed.length,
            interrupted: !!fatalError,
            ...(allFailed.length > 0 && { failedRows: allFailed }),
        },
    });
};

export const createTeacherController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user?.schoolId;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateTeacherForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
        if (existing) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "A user with this email already exists.",
                data: null,
            });
        }

        const { user, teacher } = await createTeacherService(req.body, schoolId);

        logAudit({
            userId: req.user!.id,
            action: "CREATE_TEACHER",
            entityType: "USER",
            entityId: user.id,
            details: { email: user.email },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "Teacher created successfully.",
            data: { ...user, passwordHash: undefined, teacher },
        });
    } catch (error: any) {
        req.log.error({ error }, "createTeacherController failed");
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: error.message || "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const getTeachersController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user!.schoolId!;
        const teachers = await getTeachersService(schoolId);

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_TEACHERS",
            entityType: "SCHOOL",
            entityId: schoolId,
            details: {
                totalTeachers: teachers.length,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Teachers retrieved successfully.",
            data: teachers,
        });
    } catch (error) {
        req.log.error({ error }, "getTeachersController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const getTeacherByIdController = async (req: Request, res: Response) => {
    try {
        const teacherId = Number(req.params.id);

        if (isNaN(teacherId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid teacher ID.",
                data: null,
            });
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId, role: Role.TEACHER },
            include: {
                teacher: {
                    select: {
                        studentClass: true,
                        department: true,
                        createdAt: true,
                        updatedAt: true,
                        courses: true,
                    },
                },
            },
        });

        if (!teacher || teacher.schoolId !== req.user!.schoolId || teacher.role !== Role.TEACHER) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Teacher not found.",
                data: null,
            });
        }

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_TEACHER",
            entityType: "TEACHER",
            entityId: teacherId,
            details: {
                email: teacher.email,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        const { passwordHash, teacher: teacherProfile, ...userFields } = teacher;

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Teacher retrieved successfully.",
            data: {
                ...userFields,
                ...teacherProfile,
            },
        });
    } catch (error) {
        req.log.error({ error }, "getTeacherByIdController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const updateTeacherController = async (req: Request, res: Response) => {
    try {
        const teacherId = Number(req.params.id);

        if (isNaN(teacherId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid teacher ID.",
                data: null,
            });
        }

        const existing = await getObjectById(prisma.user, teacherId);

        if (!existing || existing.schoolId !== req.user!.schoolId || existing.role !== Role.TEACHER) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Teacher not found.",
                data: null,
            });
        }

        const schoolId = req.user?.schoolId;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateTeacherUpdateForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const { class: reqClass, studentClass, department, ...userFields } = req.body;
        const teacherClass = studentClass ?? reqClass;

        const updated = await updateObject(
            prisma.user,
            { id: teacherId },
            userFields
        );

        if (teacherClass !== undefined || department !== undefined) {
            const teacherUpdateData: { studentClass?: any; department?: any } = {};
            if (school.schoolType === "UNIVERSITY") {
                if (department !== undefined) teacherUpdateData.department = department;
            } else if (school.schoolType === "SECONDARY_SCHOOL") {
                if (teacherClass !== undefined) teacherUpdateData.studentClass = teacherClass;
            }

            if (Object.keys(teacherUpdateData).length > 0) {
                await updateObject(
                    prisma.teacher,
                    { userId: teacherId },
                    teacherUpdateData
                );
            }
        }

        logAudit({
            userId: req.user!.id,
            action: "UPDATE_TEACHER",
            entityType: "USER",
            entityId: teacherId,
            details: req.body,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        const { passwordHash, ...safeUpdated } = updated;
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Teacher updated successfully.",
            data: safeUpdated,
        });
    } catch (error) {
        req.log.error({ error }, "updateTeacherController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};




// course
export const bulkUploadCoursesController = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "No file uploaded.",
            data: null,
        });
    }

    const schoolId = req.user!.schoolId!;

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolType: true },
    });

    if (!school) {
        return res.status(404).json({
            success: false,
            code: "NOT_FOUND",
            message: "School not found.",
            data: null,
        });
    }

    const seenCourses = new Set<string>();
    let currentBatch: unknown[] = [];
    let rowsSeenSoFar = 0;
    let totalInserted = 0;
    let allFailed: Array<{ row: number; data: unknown; reason: string }> = [];
    let fatalError: unknown = null;

    try {
        const parser = parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
            delimiter: ",",
            relax_column_count: true,
        });
        const parserStream = Readable.from(req.file.buffer).pipe(parser);

        for await (const row of parserStream) {
            currentBatch.push(row);
            rowsSeenSoFar++;

            if (currentBatch.length === BATCH_SIZE) {
                const startingRow = rowsSeenSoFar - currentBatch.length + 2;
                const result = await processCourseBatch(currentBatch, startingRow, school.schoolType, seenCourses, schoolId);
                totalInserted += result.inserted;
                allFailed.push(...result.failed);
                currentBatch = [];
            }
        }

        if (currentBatch.length > 0) {
            const startingRow = rowsSeenSoFar - currentBatch.length + 2;
            const result = await processCourseBatch(currentBatch, startingRow, school.schoolType, seenCourses, schoolId);
            totalInserted += result.inserted;
            allFailed.push(...result.failed);
        }
    } catch (error) {
        fatalError = error;
        req.log.error({ error, rowsSeenSoFar, totalInserted }, "Bulk course upload interrupted mid-processing");
    }

    logAudit({
        userId: req.user!.id,
        action: "BULK_UPLOAD_COURSES",
        entityType: "SCHOOL",
        entityId: schoolId,
        details: { totalRows: rowsSeenSoFar, inserted: totalInserted, failed: allFailed.length, interrupted: !!fatalError },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
    return res.status(fatalError ? 207 : 200).json({
        success: !fatalError,
        code: fatalError ? "PARTIAL_FAILURE" : "OK",
        message: fatalError
            ? `Processing stopped early after ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`
            : `Processed ${rowsSeenSoFar} rows. Inserted: ${totalInserted}, Failed: ${allFailed.length}.`,
        data: {
            totalRows: rowsSeenSoFar,
            inserted: totalInserted,
            failed: allFailed.length,
            interrupted: !!fatalError,
            ...(allFailed.length > 0 && { failedRows: allFailed }),
        },
    });
};



export const createCourseController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user?.schoolId;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateCourseForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const existing = await prisma.course.findFirst({
            where: {
                name: req.body.name,
                schoolId,
                year: req.body.year ?? null,
                class: req.body.class ?? null,
                department: req.body.department ?? null
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "This course already exists for the given year/class.",
                data: null,
            });
        }

        const course = await createCourseService(req.body, schoolId);


        logAudit({
            userId: req.user!.id,
            action: "CREATE_COURSE",
            entityType: "COURSE",
            entityId: course.id,
            details: { name: course.name },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
            syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "Course created successfully.",
            data: course,
        });
    } catch (error) {
        req.log.error({ error }, "createCourseController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null
        });
    }
};

export const updateCourseController = async (req: Request, res: Response) => {
    try {
        const courseId = Number(req.params.id);

        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid course ID.",
                data: null,
            });
        }

        const schoolId = req.user?.schoolId;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You do not manage a school.",
                data: null,
            });
        }

        const existing = await getObjectById(prisma.course, courseId);

        if (!existing || existing.schoolId !== schoolId) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Course not found or you do not have access to it.",
                data: null,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolType: true },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "School not found.",
                data: null,
            });
        }

        const schoolTypeCheck = validateCourseForSchoolType(req.body, school.schoolType);
        if (!schoolTypeCheck.valid) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: schoolTypeCheck.message,
                data: null,
            });
        }

        const updated = await updateObject(
            prisma.course,
            { id: courseId },
            req.body
        );

        logAudit({
            userId: req.user!.id,
            action: "UPDATE_COURSE",
            entityType: "COURSE",
            entityId: courseId,
            details: req.body,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
syncDepartments(schoolId).catch(err => {
    req.log.error(err, "Department sync failed");
});
        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Course updated successfully.",
            data: updated,
        });
    } catch (error) {
        req.log.error({ error }, "updateCourseController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};


export const getCoursesController = async (req: Request, res: Response) => {
    try {
        const schoolId = req.user!.schoolId!;
        const courses = await getCoursesService(schoolId);

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_COURSES",
            entityType: "SCHOOL",
            entityId: schoolId,
            details: {
                totalCourses: courses.length,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Courses retrieved successfully.",
            data: courses,
        });
    } catch (error) {
        req.log.error({ error }, "getCoursesController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};

export const getCourseByIdController = async (req: Request, res: Response) => {
    try {
        const courseId = Number(req.params.id);

        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Invalid course ID.",
                data: null,
            });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teachers: {
                    select: {
                        studentClass: true,
                        department: true,
                        createdAt: true,
                        updatedAt: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!course || course.schoolId !== req.user!.schoolId) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Course not found.",
                data: null,
            });
        }

        void logAudit({
            userId: req.user!.id,
            action: "VIEW_COURSE",
            entityType: "COURSE",
            entityId: courseId,
            details: {
                name: course.name,
                schoolId: course.schoolId,
            },
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Course retrieved successfully.",
            data: course,
        });
    } catch (error) {
        req.log.error({ error }, "getCourseByIdController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            data: null,
        });
    }
};


export const deleteCourseByIdController = async (req: Request, res: Response) => {
    const courseId = Number(req.params.id);

    try {
        const deletedCourse = await prisma.course.delete({
            where: { id: courseId },
        });

        logAudit({
            userId: req.user!.id,
            action: "DELETE_COURSE",
            entityType: "COURSE",
            entityId: courseId,
            details: deletedCourse,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Course successfully deleted",
            data: deletedCourse,
        });

    } catch (error) {

        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            req.log.error({ error }, "Course not found or already deleted");
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Course not found or already deleted",
                data: null
            });
        }
        req.log.error({ error }, "deleteCourseByIdController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete course",
            data: null
        });
    }
}


export const addTeacherToCourseController = async (req: Request, res: Response) => {
    const courseId = parseInt(req.params.courseId);
    const teacherId = parseInt(req.params.teacherId);
    const schoolId = Number(req.user!.schoolId!);
    if (isNaN(courseId) || isNaN(teacherId)) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "Invalid course or teacher ID",
            data: null
        });
    }

    try {
        const teacher = await prisma.teacher.findUnique({
            where: { userId: teacherId },
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Teacher not found",
                data: null
            });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Course not found",
                data: null
            });
        }

        if (course.schoolId !== schoolId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You are not authorized to perform this action",
                data: null
            });
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                teachers: {
                    connect: { userId: teacherId },
                },
            },
            include: {
                teachers: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        void createNotification({
  userId: teacherId,
  type: NotificationType.TEACHER_ASSIGNED_TO_COURSE,
  title: "Course Assigned",
  message: `You have been assigned to teach ${course.name} for ${course.year || course.class}.`,
  entityType: "COURSE",
  entityId: courseId,
}).catch((error) => {
  req.log.error(
    {
      error,
      teacherId,
      courseId,
    },
    "Failed to create teacher course assignment notification"
  );
});
        logAudit({
            userId: req.user!.id,
            action: "ADD_TEACHER_TO_COURSE",
            entityType: "COURSE",
            entityId: courseId,
            details: updatedCourse,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: `Teacher ${teacherId} added to course ${courseId}`,
            data: updatedCourse,
        });

    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    code: "NOT_FOUND",
                    message: "Teacher or course not found",
                    data: null
                });
            }
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    code: "CONFLICT",
                    message: "Teacher is already assigned to this course",
                    data: null
                });
            }
        }

        req.log.error({ error }, "addTeacherToCourseController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add teacher to course",
            data: null
        });
    }
};

export const removeTeacherFromCourseController = async (req: Request, res: Response) => {
    const courseId = parseInt(req.params.courseId);
    const teacherId = parseInt(req.params.teacherId);
    const schoolId = req.user!.schoolId!;
    if (isNaN(courseId) || isNaN(teacherId)) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "Invalid course or teacher ID",
            data: null
        });
    }

    try {
        const teacher = await prisma.teacher.findUnique({
            where: { userId: teacherId },
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Teacher not found",
                data: null
            });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Course not found",
                data: null
            });
        }

        if (course.schoolId !== schoolId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You are not authorized to perform this action",
                data: null
            });
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                teachers: {
                    disconnect: { userId: teacherId },
                },
            },
            include: {
                teachers: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        void createNotification({
  userId: teacherId,    
  type: NotificationType.TEACHER_REMOVED_FROM_COURSE,
  title: "Course Assignment Removed",
  message: `You have been removed from teaching ${course.name}.`,
  entityType: "COURSE",
  entityId: courseId,
}).catch((error) => {
  req.log.error(
    {
      error,
      teacherId,
      courseId,
    },
    "Failed to create teacher course removal notification"
  );
});

        logAudit({
            userId: req.user!.id,
            action: "REMOVE_TEACHER_FROM_COURSE",
            entityType: "COURSE",
            entityId: courseId,
            details: updatedCourse,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
        return res.status(200).json({
            success: true,
            code: "OK",
            message: `Teacher ${teacherId} removed from course ${courseId}`,
            data: updatedCourse,
        });

    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    code: "NOT_FOUND",
                    message: "Teacher or course not found",
                    data: null
                });
            }
        }

        req.log.error({ error }, "removeTeacherFromCourse failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove teacher from course",
            data: null
        });
    }
};


export const activateUserController = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "Invalid user ID",
            data: null
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                role: true,
                schoolId: true
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "User not found",
                data: null
            });
        }


        if (user.schoolId !== req.user!.schoolId || req.user?.id === userId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You are not authorized to perform this action",
                data: null
            });
        }

        if (user.status === AccountStatus.ACTIVATED) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "User account is already activated",
                data: null
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: AccountStatus.ACTIVATED,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });

        logAudit({
            userId: req.user!.id,
            action: "USER_ACTIVATED",
            entityType: "USER",
            entityId: userId,
            details: updatedUser,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: `User account activated successfully`,
            data: updatedUser,
        });

    } catch (error) {
        req.log.error({ error }, "activateUser controller error");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to activate user account",
            data: null
        });
    }
};

export const deactivateUserController = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "Invalid user ID",
            data: null
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                role: true,
                schoolId: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "User not found",
                data: null
            });
        }

        if (user.status === 'DEACTIVATED') {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "User account is already deactivated",
                data: null
            });
        }

        if (user.schoolId !== req.user!.schoolId || req.user?.id === userId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You are not authorized to perform this action",
                data: null
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'DEACTIVATED',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });

        logAudit({
            userId: req.user!.id,
            action: "USER_DEACTIVATED",
            entityType: "USER",
            entityId: userId,
            details: updatedUser,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: `User account deactivated successfully`,
            data: updatedUser,
        });

    } catch (error) {
        req.log.error({ error }, "Audit log failed");
        return res.status(500).json({
            success: false,
            message: "Failed to deactivate user account",
        });
    }
};


// school config

// Default values
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


export const getSchoolConfigController = async (req: Request, res: Response) => {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "You do not manage a school",
            data: null,
        });
    }

    try {
        let config = await prisma.schoolConfig.findUnique({
            where: { schoolId },
        });

        // If no config exists, create with defaults
        if (!config) {
            config = await prisma.schoolConfig.create({
                data: {
                    schoolId,
                    gradingBands: DEFAULT_GRADING_BANDS,
                    cgpa: DEFAULT_CGPA_CONFIG,
                },
            });
        }

        logAudit({
            userId: req.user!.id,
            action: "SCHOOL_CONFIG_RETRIEVED",
            entityType: "SCHOOL",
            entityId: schoolId,
            details: config,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));
        return res.status(200).json({
            success: true,
            code: "OK",
            message: `School configuration retrieved successfully`,
            data: config,
        });

    } catch (error) {
        req.log.error({ error }, "Audit log failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get school configuration",
            error: error
        });
    }
};


export const updateSchoolConfigController = async (req: Request, res: Response) => {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            code: "BAD_REQUEST",
            message: "You do not manage a school",
            data: null,
        });
    }

    try {
        // Get validated input from request (already validated by middleware)
        const validatedData = req.body

        // Check if config exists
        const existingConfig = await prisma.schoolConfig.findUnique({
            where: { schoolId },
        });

        let updatedConfig;

        if (!existingConfig) {
            // Create new config
            updatedConfig = await prisma.schoolConfig.create({
                data: {
                    schoolId,
                    gradingBands: validatedData.gradingBands || DEFAULT_GRADING_BANDS,
                    cgpa: validatedData.cgpa || DEFAULT_CGPA_CONFIG,
                },
            });
        } else {
            // Update existing config
            const updateData: any = {};
            if (validatedData.gradingBands) {
                updateData.gradingBands = validatedData.gradingBands;
            }
            if (validatedData.cgpa) {
                updateData.cgpa = validatedData.cgpa;
            }

            updatedConfig = await prisma.schoolConfig.update({
                where: { schoolId },
                data: updateData,
            });
        }

        logAudit({
            userId: req.user!.id,
            action: "SCHOOL_CONFIG_UPDATED",
            entityType: "SCHOOL",
            entityId: schoolId,
            details: updatedConfig,
        }).catch((err) => req.log.error({ err }, "Audit log failed"));

        return res.status(200).json({
            success: true,
            code: "OK",
            message: `School configuration updated successfully`,
            data: updatedConfig,
        });

    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: "School configuration already exists",
                });
            }
        }

        req.log.error({ error }, 'Update school config error:');
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update school configuration",
            data: null,
        });
    }
};

export const getMyNotificationsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;

  const { isRead, limit, markAsRead } = req.query;

  // Validate isRead
  if (
    isRead !== undefined &&
    isRead !== "true" &&
    isRead !== "false"
  ) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "isRead must be true or false",
      data: null,
    });
  }

  // Validate markAsRead
  if (
    markAsRead !== undefined &&
    markAsRead !== "true" &&
    markAsRead !== "false"
  ) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "markAsRead must be true or false",
      data: null,
    });
  }

  // Validate limit
  let take = 10;

  if (limit !== undefined) {
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: "limit must be an integer between 1 and 100",
        data: null,
      });
    }

    take = parsedLimit;
  }

  // Build notification filter
  const where: Prisma.NotificationWhereInput = {
    userId,
  };

  if (isRead !== undefined) {
    where.isRead = isRead === "true";
  }

  const shouldMarkAsRead = markAsRead === "true";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get notifications
      const notifications = await tx.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take,
      });

      let markedIds: number[] = [];
      let markedAt: Date | null = null;

      // 2. Mark returned unread notifications as read
      if (shouldMarkAsRead && notifications.length > 0) {
        const unreadIds = notifications
          .filter((notification) => !notification.isRead)
          .map((notification) => notification.id);

        if (unreadIds.length > 0) {
          markedAt = new Date();

          await tx.notification.updateMany({
            where: {
              id: {
                in: unreadIds,
              },
              userId,
              isRead: false,
            },
            data: {
              isRead: true,
              readAt: markedAt,
            },
          });

          markedIds = unreadIds;
        }
      }

      // 3. Get total notification count
      const totalCount = await tx.notification.count({
        where: {
          userId,
        },
      });

      // 4. Get unread count
      const unreadCount = await tx.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      // 5. Format notifications
      const formattedNotifications = notifications.map((notification) => {
        const wasMarkedAsRead = markedIds.includes(notification.id);

        return {
          ...notification,
          isRead: wasMarkedAsRead
            ? true
            : notification.isRead,

          readAt: wasMarkedAsRead
            ? markedAt
            : notification.readAt,
        };
      });

      return {
        notifications: formattedNotifications,
        total: totalCount,
        unreadCount,
        markedCount: markedIds.length,
      };
    });

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Notifications retrieved successfully",
      data: {
        notifications: result.notifications,
        count: result.notifications.length,
        total: result.total,
        unreadCount: result.unreadCount,
        markedAsRead: result.markedCount,
      },
    });
  } catch (error) {
    req.log.error(
      { error, userId },
      "getMyNotificationsController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch notifications",
      data: null,
    });
  }
};

