import { prisma } from "../../../shared/prisma/prisma";
import { Prisma, SchoolType, Year, Class } from "@prisma/client";
import { updateObject, getObjectsByField } from "../../../shared/prisma/repoLayer"
import { Role, AccountStatus } from "@prisma/client";
import { studentRowSchema, StudentRowInput, teacherRowSchema, TeacherRowInput, FailedRow, courseRowSchema, CourseRowInput } from "../../../shared/validator/validator";
import { logger } from "../../../shared/logger";

export function validateStudentForSchoolType(
    data: { year?: any; class?: any; department?: any },
    schoolType: SchoolType
): { valid: boolean; message?: string } {
    if (schoolType === "UNIVERSITY") {
        if (data.class !== undefined && data.class !== null && data.class !== "") {
            return {
                valid: false,
                message: "Class is not allowed for a university student. Provide year and department.",
            };
        }
        if (!data.year || !data.department) {
            return {
                valid: false,
                message: "A university student requires both year and department.",
            };
        }
    } else if (schoolType === "SECONDARY_SCHOOL") {
        if (
            (data.year !== undefined && data.year !== null && data.year !== "") ||
            (data.department !== undefined && data.department !== null && data.department !== "")
        ) {
            return {
                valid: false,
                message: "Year and department are not allowed for a secondary school student. Provide class.",
            };
        }
        if (!data.class) {
            return {
                valid: false,
                message: "A secondary school student requires a class.",
            };
        }
    }

    return { valid: true };
}

export function validateStudentUpdateForSchoolType(
    data: { year?: any; class?: any; department?: any },
    schoolType: SchoolType
): { valid: boolean; message?: string } {
    if (schoolType === "UNIVERSITY") {
        if (data.class !== undefined && data.class !== null && data.class !== "") {
            return {
                valid: false,
                message: "Class cannot be updated for a university student. Only year and department are allowed.",
            };
        }
    } else if (schoolType === "SECONDARY_SCHOOL") {
        if (
            (data.year !== undefined && data.year !== null && data.year !== "") ||
            (data.department !== undefined && data.department !== null && data.department !== "")
        ) {
            return {
                valid: false,
                message: "Year and department cannot be updated for a secondary school student. Only class is allowed.",
            };
        }
    }

    return { valid: true };
}

export function validateTeacherForSchoolType(
    data: { department?: any; studentClass?: any; class?: any },
    schoolType: SchoolType
): { valid: boolean; message?: string } {
    const teacherClass = data.studentClass ?? data.class;
    if (schoolType === "UNIVERSITY") {
        if (teacherClass !== undefined && teacherClass !== null && teacherClass !== "") {
            return {
                valid: false,
                message: "Class is not allowed for a university teacher. Provide department.",
            };
        }
        if (!data.department) {
            return {
                valid: false,
                message: "A university teacher requires a department.",
            };
        }
    } else if (schoolType === "SECONDARY_SCHOOL") {
        if (data.department !== undefined && data.department !== null && data.department !== "") {
            return {
                valid: false,
                message: "Department is not allowed for a secondary school teacher. Provide class.",
            };
        }
        if (!teacherClass) {
            return {
                valid: false,
                message: "A secondary school teacher requires a class.",
            };
        }
    }

    return { valid: true };
}

export function validateTeacherUpdateForSchoolType(
    data: { department?: any; studentClass?: any; class?: any },
    schoolType: SchoolType
): { valid: boolean; message?: string } {
    const teacherClass = data.studentClass ?? data.class;
    if (schoolType === "UNIVERSITY") {
        if (teacherClass !== undefined && teacherClass !== null && teacherClass !== "") {
            return {
                valid: false,
                message: "Class cannot be updated for a university teacher. Only department is allowed.",
            };
        }
    } else if (schoolType === "SECONDARY_SCHOOL") {
        if (data.department !== undefined && data.department !== null && data.department !== "") {
            return {
                valid: false,
                message: "Department cannot be updated for a secondary school teacher. Only class is allowed.",
            };
        }
    }

    return { valid: true };
}


export function validateCourseForSchoolType(
    body: { year?: unknown; class?: unknown; department?: unknown },
    schoolType: SchoolType
): { valid: boolean; message?: string } {
    if (schoolType === SchoolType.UNIVERSITY && !body.year) {
        return { valid: false, message: "This school uses year-based classification. Please provide a year (and department)." };
    }
    if (schoolType === SchoolType.SECONDARY_SCHOOL && !body.class) {
        return { valid: false, message: "This school uses class-based classification. Please provide a class." };
    }
    if (schoolType === SchoolType.UNIVERSITY && body.class) {
        return { valid: false, message: "This school does not use class-based classification." };
    }
    if (schoolType === SchoolType.SECONDARY_SCHOOL && body.year) {
        return { valid: false, message: "This school does not use year-based classification." };
    }
    return { valid: true };
}

type ValidatedStudentRow = { rowNumber: number; data: StudentRowInput };

type CreateSchoolInput = {
    name: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    schoolType: "UNIVERSITY" | "SECONDARY_SCHOOL";
    description?: string;
};

export const createSchoolService = async (
    input: CreateSchoolInput,
    data: { pin: string; userId: number }
) => {
    return prisma.$transaction(async (tx) => {
        const newSchool = await tx.school.create({
            data: {
                pin: data.pin,
                name: input.name,
                email: input.email,
                website: input.website,
                address: input.address,
                city: input.city,
                state: input.state,
                country: input.country,
                schoolType: input.schoolType,
                description: input.description,
                createdById: data.userId,
            },
        });

        await tx.user.update({
            where: { id: data.userId },
            data: {
                schoolId: newSchool.id,
            },
        });

        return newSchool;
    });
};


export const updateSchoolService = async (id: number, data: Prisma.SchoolUpdateInput) => {
    try {
        const result = await updateObject(
            prisma.school,
            { id: id },
            data
        );

        return {
            success: true as const,
            code: "UPDATED",
            message: "School updated successfully",
            data: result
        }
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return {
                success: false as const,
                statusCode: 404,
                code: "NOT_FOUND",
                message: "The school with the provided id does not exist.",
                error: null,
            };
        }

        return {
            success: false as const,
            statusCode: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update school.",
            error: null
        };
    }
};


export const readSchoolService = async (id: number) => {
    try {
        const school = await getObjectsByField(prisma.school, "createdById", id);
        if (!school[0]) {
            return {
                success: false as const,
                statusCode: 404,
                code: "NOT_FOUND",
                message: "You do not manage any school",
                error: null,
            };
        }

        return {
            success: true as const,
            code: "OK",
            message: "School fetched successfully",
            data: school
        };
    } catch (error) {
        return {
            success: false as const,
            statusCode: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to read school.",
            error: error
        };
    }
}



export function validateRows(
    rows: unknown[],
    startingRow: number,
    seenEmails: Set<string>,
    schoolType?: SchoolType
): { valid: ValidatedStudentRow[]; failed: FailedRow[] } {
    const valid: ValidatedStudentRow[] = [];
    const failed: FailedRow[] = [];

    rows.forEach((row, i) => {
        const rowNumber = startingRow + i;
        const parsed = studentRowSchema.safeParse(row);

        if (!parsed.success) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
            });
            return;
        }

        if (schoolType) {
            const schoolTypeCheck = validateStudentForSchoolType(parsed.data, schoolType);
            if (!schoolTypeCheck.valid) {
                failed.push({
                    row: rowNumber,
                    data: row,
                    reason: schoolTypeCheck.message!,
                });
                return;
            }
        }

        if (seenEmails.has(parsed.data.email)) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: `Duplicate email "${parsed.data.email}" found within the uploaded file.`,
            });
            return;
        }

        seenEmails.add(parsed.data.email);
        valid.push({ rowNumber, data: parsed.data });
    });

    return { valid, failed };
}


export async function filterExistingEmails(
    rows: ValidatedStudentRow[]
): Promise<{ toInsert: ValidatedStudentRow[]; failed: FailedRow[] }> {
    if (rows.length === 0) return { toInsert: [], failed: [] };

    const emails = rows.map(r => r.data.email);
    const existing = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true },
    });
    const existingEmails = new Set(existing.map(u => u.email));

    const toInsert: ValidatedStudentRow[] = [];
    const failed: FailedRow[] = [];

    for (const row of rows) {
        if (existingEmails.has(row.data.email)) {
            failed.push({
                row: row.rowNumber,
                data: row.data,
                reason: `Email "${row.data.email}" already exists in the database.`,
            });
        } else {
            toInsert.push(row);
        }
    }

    return { toInsert, failed };
}


export async function insertStudentRows(
    rows: ValidatedStudentRow[],
    schoolId: number,
    schoolType?: SchoolType
): Promise<{ inserted: number; failed: FailedRow[] }> {
    let inserted = 0;
    const failed: FailedRow[] = [];

    for (const row of rows) {
        try {
            await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        firstName: row.data.firstName,
                        lastName: row.data.lastName,
                        email: row.data.email,
                        phoneNumber: row.data.phoneNumber,
                        role: Role.STUDENT,
                        status: AccountStatus.PENDING,
                        schoolId,
                    },
                });

                await tx.student.create({
                    data: {
                        userId: user.id,
                        year: schoolType === "SECONDARY_SCHOOL" ? undefined : row.data.year,
                        class: schoolType === "UNIVERSITY" ? undefined : row.data.class,
                        department: schoolType === "SECONDARY_SCHOOL" ? undefined : row.data.department,
                    },
                });
            });
            inserted++;
        } catch (error) {
            logger.error({ error, row: row.rowNumber }, "Failed to insert student row");
            failed.push({
                row: row.rowNumber,
                data: row.data,
                reason: "Database error while creating this student.",
            });
        }
    }

    return { inserted, failed };
}

export async function processStudentBatch(
    rows: unknown[],
    startingRow: number,
    seenEmails: Set<string>,
    schoolId: number,
    schoolType?: SchoolType
): Promise<{ inserted: number; failed: FailedRow[] }> {
    const { valid, failed: validationFailures } = validateRows(rows, startingRow, seenEmails, schoolType);
    const { toInsert, failed: duplicateFailures } = await filterExistingEmails(valid);
    const { inserted, failed: insertFailures } = await insertStudentRows(toInsert, schoolId, schoolType);

    return {
        inserted,
        failed: [...validationFailures, ...duplicateFailures, ...insertFailures],
    };
}



export const createStudentService = async (input: StudentRowInput, schoolId: number) => {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolType: true },
    });

    if (!school) {
        throw new Error("School not found.");
    }

    const check = validateStudentForSchoolType(input, school.schoolType);
    if (!check.valid) {
        throw new Error(check.message);
    }

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phoneNumber: input.phoneNumber,
                role: Role.STUDENT,
                status: AccountStatus.PENDING,
                schoolId,
            },
        });

        const student = await tx.student.create({
            data: {
                userId: user.id,
                year: school.schoolType === "UNIVERSITY" ? input.year : undefined,
                class: school.schoolType === "SECONDARY_SCHOOL" ? input.class : undefined,
                department: school.schoolType === "UNIVERSITY" ? input.department : undefined,
            },
        });

        return { user, student };
    });
};


export const getStudentsService = async (schoolId: number) => {
    return prisma.user.findMany({
        where: {
            schoolId,
            role: Role.STUDENT,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            status: true,
            createdAt: true,
            student: {
                select: {
                    year: true,
                    class: true,
                    department: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

type ValidatedTeacherRow = { rowNumber: number; data: TeacherRowInput };

export function validateTeacherRows(
    rows: unknown[],
    startingRow: number,
    seenEmails: Set<string>,
    schoolType?: SchoolType
): { valid: ValidatedTeacherRow[]; failed: FailedRow[] } {
    const valid: ValidatedTeacherRow[] = [];
    const failed: FailedRow[] = [];

    rows.forEach((row, i) => {
        const rowNumber = startingRow + i;
        const parsed = teacherRowSchema.safeParse(row);

        if (!parsed.success) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
            });
            return;
        }

        if (schoolType) {
            const schoolTypeCheck = validateTeacherForSchoolType(parsed.data, schoolType);
            if (!schoolTypeCheck.valid) {
                failed.push({
                    row: rowNumber,
                    data: row,
                    reason: schoolTypeCheck.message!,
                });
                return;
            }
        }

        if (seenEmails.has(parsed.data.email)) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: `Duplicate email "${parsed.data.email}" found within the uploaded file.`,
            });
            return;
        }

        seenEmails.add(parsed.data.email);
        valid.push({ rowNumber, data: parsed.data });
    });

    return { valid, failed };
}

export async function insertTeacherRows(
    rows: ValidatedTeacherRow[],
    schoolId: number,
    schoolType?: SchoolType
): Promise<{ inserted: number; failed: FailedRow[] }> {
    let inserted = 0;
    const failed: FailedRow[] = [];

    for (const row of rows) {
        try {
            await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        firstName: row.data.firstName,
                        lastName: row.data.lastName,
                        email: row.data.email,
                        phoneNumber: row.data.phoneNumber,
                        role: Role.TEACHER,
                        status: AccountStatus.PENDING,
                        schoolId,
                    },
                });

                await tx.teacher.create({
                    data: {
                        userId: user.id,
                        studentClass: schoolType === "UNIVERSITY" ? undefined : (row.data.studentClass ?? row.data.class),
                        department: schoolType === "SECONDARY_SCHOOL" ? undefined : row.data.department,
                    },
                });
            });
            inserted++;
        } catch (error) {
            logger.error({ error, row: row.rowNumber }, "Failed to insert teacher row");
            failed.push({
                row: row.rowNumber,
                data: row.data,
                reason: "Database error while creating this teacher.",
            });
        }
    }

    return { inserted, failed };
}

export async function processTeacherBatch(
    rows: unknown[],
    startingRow: number,
    seenEmails: Set<string>,
    schoolId: number,
    schoolType?: SchoolType
): Promise<{ inserted: number; failed: FailedRow[] }> {
    const { valid, failed: validationFailures } = validateTeacherRows(rows, startingRow, seenEmails, schoolType);
    const { toInsert, failed: duplicateFailures } = await filterExistingEmails(valid as any);
    const { inserted, failed: insertFailures } = await insertTeacherRows(toInsert as any, schoolId, schoolType);

    return {
        inserted,
        failed: [...validationFailures, ...duplicateFailures, ...insertFailures],
    };
}

export const createTeacherService = async (input: TeacherRowInput, schoolId: number) => {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolType: true },
    });

    if (!school) {
        throw new Error("School not found.");
    }

    const check = validateTeacherForSchoolType(input, school.schoolType);
    if (!check.valid) {
        throw new Error(check.message);
    }

    const teacherClass = input.studentClass ?? input.class;

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phoneNumber: input.phoneNumber,
                role: Role.TEACHER,
                status: AccountStatus.PENDING,
                schoolId,
            },
        });

        const teacher = await tx.teacher.create({
            data: {
                userId: user.id,
                studentClass: school.schoolType === "SECONDARY_SCHOOL" ? teacherClass : undefined,
                department: school.schoolType === "UNIVERSITY" ? input.department : undefined,
            },
        });

        return { user, teacher };
    });
};

export const getTeachersService = async (schoolId: number) => {
    return prisma.user.findMany({
        where: {
            schoolId,
            role: Role.TEACHER,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            status: true,
            createdAt: true,
            teacher: {
                select: {
                    studentClass: true,
                    department: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};




// courses 
type ValidatedRow = { rowNumber: number; data: CourseRowInput };

export function validateCourseRows(
    rows: unknown[],
    startingRow: number,
    schoolType: SchoolType,
    seenCourses: Set<string>
): { valid: ValidatedRow[]; failed: FailedRow[] } {
    const valid: ValidatedRow[] = [];
    const failed: FailedRow[] = [];

    rows.forEach((row, i) => {
        const rowNumber = startingRow + i;
        const parsed = courseRowSchema.safeParse(row);

        if (!parsed.success) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
            });
            return;
        }

        if (schoolType === SchoolType.UNIVERSITY && !parsed.data.year) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: "This school uses year-based classification. Please provide a year (and department).",
            });
            return;
        }

        if (schoolType === SchoolType.SECONDARY_SCHOOL && !parsed.data.class) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: "This school uses class-based classification. Please provide a class.",
            });
            return;
        }

        if (schoolType === SchoolType.UNIVERSITY && parsed.data.class) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: "This school does not use class-based classification.",
            });
            return;
        }

        if (schoolType === SchoolType.SECONDARY_SCHOOL && parsed.data.year) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: "This school does not use year-based classification.",
            });
            return;
        }

        const dedupeKey = `${parsed.data.name}|${parsed.data.year ?? ""}|${parsed.data.class ?? ""}`;
        if (seenCourses.has(dedupeKey)) {
            failed.push({
                row: rowNumber,
                data: row,
                reason: `Duplicate course "${parsed.data.name}" (same year/class) found within the uploaded file.`,
            });
            return;
        }
        seenCourses.add(dedupeKey);

        valid.push({ rowNumber, data: parsed.data });
    });

    return { valid, failed };
}

export async function filterExistingCourses(
    rows: ValidatedRow[],
    schoolId: number
): Promise<{ toInsert: ValidatedRow[]; failed: FailedRow[] }> {
    if (rows.length === 0) return { toInsert: [], failed: [] };

    const existing = await prisma.course.findMany({
        where: {
            schoolId,
            OR: rows.map((r) => ({
                name: r.data.name,
                year: r.data.year ?? null,
                class: r.data.class ?? null,
                department: r.data.department ?? null,
            })),
        },
        select: { name: true, year: true, class: true, department: true },
    });

    const existingKeys = new Set(
        existing.map((c: { name: string; year: Year | null; class: Class | null; department: string | null }) =>
            `${c.name}|${c.year ?? ""}|${c.class ?? ""}|${c.department ?? ""}`
        )
    );

    const toInsert: ValidatedRow[] = [];
    const failed: FailedRow[] = [];

    for (const row of rows) {
        const key = `${row.data.name}|${row.data.year ?? ""}|${row.data.class ?? ""}|${row.data.department ?? ""}`;
        if (existingKeys.has(key)) {
            failed.push({
                row: row.rowNumber,
                data: row.data,
                reason: `Course "${row.data.name}" already exists for this year/class/department in your school.`,
            });
        } else {
            toInsert.push(row);
        }
    }

    return { toInsert, failed };
}

export async function insertCourseRows(
    rows: ValidatedRow[],
    schoolId: number
): Promise<{ inserted: number; failed: FailedRow[] }> {
    let inserted = 0;
    const failed: FailedRow[] = [];

    for (const row of rows) {
        try {
            await prisma.course.create({
                data: {
                    name: row.data.name,
                    year: row.data.year,
                    class: row.data.class,
                    department: row.data.department,
                    schoolId,
                },
            });
            inserted++;
        } catch (error) {
            logger.error({ error, row: row.rowNumber }, "Failed to insert course row");
            failed.push({ row: row.rowNumber, data: row.data, reason: "Database error while creating this course." });
        }
    }

    return { inserted, failed };
}

export async function processCourseBatch(
    rows: unknown[],
    startingRow: number,
    schoolType: SchoolType,
    seenCourses: Set<string>,
    schoolId: number
): Promise<{ inserted: number; failed: FailedRow[] }> {
    const { valid, failed: validationFailures } = validateCourseRows(rows, startingRow, schoolType, seenCourses);
    const { toInsert, failed: duplicateFailures } = await filterExistingCourses(valid, schoolId);
    const { inserted, failed: insertFailures } = await insertCourseRows(toInsert, schoolId);

    return { inserted, failed: [...validationFailures, ...duplicateFailures, ...insertFailures] };
}

export const createCourseService = async (input: CourseRowInput, schoolId: number) => {
    return prisma.course.create({
        data: {
            name: input.name,
            year: input.year,
            class: input.class,
            department: input.department,
            schoolId,
        },
    });
};

export const getCoursesService = async (schoolId: number) => {
    return prisma.course.findMany({
        where: {
            schoolId,
        },
        select: {
            id: true,
            name: true,
            year: true,
            class: true,
            department: true,
            teachers: {
                select: {
                    department: true,
                    studentClass: true,
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
        orderBy: { createdAt: "desc" },
    });
};



