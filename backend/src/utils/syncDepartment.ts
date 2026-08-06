
import { prisma } from "../shared/prisma/prisma";

const generateDepartmentCode = (
    name: string,
    existingCodes: Set<string>
): string => {
    const clean = name.replace(/[^A-Za-z]/g, "").toUpperCase();
    const words = name.trim().split(/\s+/);

    const candidates = [
        clean.slice(0, 3),
        clean.slice(0, 4),
        words.map(word => word[0]).join("").toUpperCase(),
    ].filter(Boolean);

    for (const code of candidates) {
        if (!existingCodes.has(code)) {
            existingCodes.add(code);
            return code;
        }
    }

    let counter = 1;

    while (true) {
        const code = `${clean.slice(0, 4)}${counter}`;

        if (!existingCodes.has(code)) {
            existingCodes.add(code);
            return code;
        }

        counter++;
    }
};

export const syncDepartments = async (schoolId: number): Promise<void> => {
    try {
        const [teachers, students, courses, departments] = await Promise.all([
            prisma.teacher.findMany({
                where: {
                    user: {
                        schoolId,
                    },
                },
                select: {
                    department: true,
                },
            }),

            prisma.student.findMany({
                where: {
                    user: {
                        schoolId,
                    },
                },
                select: {
                    department: true,
                },
            }),

            prisma.course.findMany({
                where: {
                    schoolId,
                },
                select: {
                    department: true,
                },
            }),

            prisma.department.findMany({
                where: {
                    schoolId,
                },
                select: {
                    name: true,
                    code: true,
                },
            }),
        ]);

        const existingNames = new Set(
            departments.map(d => d.name.toUpperCase())
        );

        const existingCodes = new Set(
            departments.map(d => d.code.toUpperCase())
        );

        const discoveredDepartments = new Set<string>();

        [...teachers, ...students, ...courses].forEach(({ department }) => {
            if (department?.trim()) {
                discoveredDepartments.add(department.trim().toUpperCase());
            }
        });

        const newDepartments = [...discoveredDepartments]
            .filter(name => !existingNames.has(name))
            .map(name => ({
                schoolId,
                name,
                code: generateDepartmentCode(name, existingCodes),
            }));

        if (newDepartments.length > 0) {
            await prisma.department.createMany({
                data: newDepartments,
            });
        }
    } catch (error) {
        console.error("Failed to sync departments:", error);
    }
};