
import { Prisma } from "@prisma/client";
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


export const assignRegNo = async (userId: number) => {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.regNo) {
      throw new Error("Student already has a registration number");
    }

    const schoolId = student.user.schoolId; 

    if (!schoolId) {
      throw new Error("User has no associated school");
    }

    let prefix: string;
    let where: Prisma.StudentWhereInput;


    if (student.class && !(student.year && student.department)) {
      prefix = student.class;

      where = {
        class: student.class,
        user: { schoolId },
        regNo: { not: null },
      };
    }
    
    else if (student.year && student.department) {
      const department = await tx.department.findUnique({
        where: {
          schoolId_name: {
            schoolId,
            name: student.department,
          },
        },
      });

      if (!department) {
        throw new Error(
          `Department "${student.department}" not found for this school`
        );
      }

      prefix = `${student.year}/${department.code}`;

      where = {
        year: student.year,
        department: student.department,
        user: { schoolId },
        regNo: { not: null },
      };
    } else {
      throw new Error(
        "Student must have either a class, or both year and department, to be assigned a reg no"
      );
    }

 
    const lastStudent = await tx.student.findFirst({
      where,
      orderBy: { regNo: "desc" },
    });

    let nextNumber = 1;

    if (lastStudent?.regNo) {
      const parts = lastStudent.regNo.split("/");
      const lastNumberStr = parts[parts.length - 1];
      const lastNumber = parseInt(lastNumberStr, 10);

      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");
    const regNo = `${prefix}/${paddedNumber}`;

    const updated = await tx.student.update({
      where: { userId },
      data: { regNo },
    });

    return updated;
  });
};