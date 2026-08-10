import { prisma } from "../../../shared/prisma/prisma";
import { Prisma, ResultFlag, ResultStatus } from "@prisma/client";

export const registerCourses = async (
  studentId: number,
  schoolId: number,
  courseIds: number[]
) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (student.user.schoolId !== schoolId) {
    throw new Error('Student does not belong to this school');
  }


  const validCourses = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      schoolId: schoolId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (validCourses.length === 0) {
    throw new Error('No valid courses found');
  }

  const validCourseIds = validCourses.map(c => c.id);
  const invalidCourseIds = courseIds.filter(id => !validCourseIds.includes(id));

  // Replace all courses in ONE transaction
  const updatedStudent = await prisma.$transaction(async (tx) => {
    // Step 1: Disconnect ALL existing courses
    await tx.student.update({
      where: { userId: studentId },
      data: {
        courses: {
          set: [], 
        },
      },
    });

    // Step 2: Connect the new courses
    const updated = await tx.student.update({
      where: { userId: studentId },
      data: {
        courses: {
          connect: validCourseIds.map(id => ({ id })),
        },
      },
      include: {
        courses: {
          include: {
            teachers: {
              include: {
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
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  });

  return {
    student: {
      id: updatedStudent.userId,
      name: `${updatedStudent.user.firstName} ${updatedStudent.user.lastName}`,
      regNo: updatedStudent.regNo,
      department: updatedStudent.department,
      year: updatedStudent.year,
      class: updatedStudent.class,
    },
    courses: updatedStudent.courses,
    summary: {
      totalRequested: courseIds.length,
      successfullyRegistered: validCourseIds.length,
      invalidCourses: invalidCourseIds.length,
      invalidCourseIds: invalidCourseIds.length > 0 ? invalidCourseIds : undefined,
    },
  };
};

export const getStudentResults = async (
  studentId: number,
  schoolId: number,
  filters?: {
    courseId?: number;
    status?: ResultStatus;
    grade?: string;
    flagged?: boolean;
  }
) => {

  const student = await prisma.student.findUnique({
    where: {
      userId: studentId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          schoolId: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (student.user.schoolId !== schoolId) {
    throw new Error("Student does not belong to this school");
  }

  const entryWhere: Prisma.ResultEntryWhereInput = {
    ...(filters?.courseId !== undefined && {
      courseId: filters.courseId,
    }),

    ...(filters?.status !== undefined && {
      status: filters.status,
    }),

    ...(filters?.grade !== undefined && {
      grade: filters.grade,
    }),

    ...(filters?.flagged !== undefined && {
      flag: filters.flagged
        ? ResultFlag.FLAGGED
        : ResultFlag.NOT_FLAGGED,
    }),
  };

  const studentResults = await prisma.studentResult.findMany({
    where: {
      studentId,
      ResultEntry: {
        some: entryWhere,
      },
    },

    include: {
      ResultEntry: {
        where: entryWhere,
        include: {
          Course: {
            select: {
              id: true,
              name: true,
              department: true,
              year: true,
              class: true,
            },
          },
        },
        orderBy: {
          Course: {
            name: "asc",
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedResults = studentResults.map((studentResult) => ({
    resultId: studentResult.id,
    submittedAt: studentResult.createdAt,
    updatedAt: studentResult.updatedAt,

    courses: studentResult.ResultEntry.map((entry) => ({
      entryId: entry.id,
      courseId: entry.courseId,
      courseName: entry.Course.name,

      department: entry.Course.department,
      year: entry.Course.year,
      class: entry.Course.class,

      caScore: Number(entry.caScore),
      examScore: Number(entry.examScore),
      totalScore: Number(entry.totalScore),

      grade: entry.grade,
      status: entry.status,

      flag: entry.flag,
      flagDescription: entry.flagDescription,
      isFlagged: entry.flag === ResultFlag.FLAGGED,
    })),

    totalCourses: studentResult.ResultEntry.length,
  }));

  return {
    student: {
      id: student.userId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      regNo: student.regNo,
      email: student.user.email,
      department: student.department,
      year: student.year,
      class: student.class,
    },

    results: formattedResults,

    summary: {
      totalResults: studentResults.length,
      totalCourses: studentResults.reduce(
        (total, result) => total + result.ResultEntry.length,
        0
      ),
    },
  };
};

export const flagResultEntry = async (
  entryId: number,
  studentId: number,
  schoolId: number,
  description: string
) => {
  const entry = await prisma.resultEntry.findUnique({
    where: {
      id: entryId,
    },

    include: {
      StudentResult: {
        include: {
          Student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  schoolId: true,
                },
              },
            },
          },
        },
      },

      Course: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error("Result entry not found");
  }

  if (entry.StudentResult.studentId !== studentId) {
    throw new Error("You are not authorized to flag this result");
  }

  if (entry.StudentResult.Student.user.schoolId !== schoolId) {
    throw new Error("Result does not belong to your school");
  }

  if (entry.flag === ResultFlag.FLAGGED) {
    throw new Error("This result is already flagged");
  }

  const updatedEntry = await prisma.resultEntry.update({
    where: {
      id: entryId,
    },

    data: {
      flag: ResultFlag.FLAGGED,
      flagDescription: description,
    },

    include: {
      StudentResult: {
        include: {
          Student: {
            include: {
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
      },

      Course: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
  });

  return {
    entry: {
      id: updatedEntry.id,

      studentId: updatedEntry.StudentResult.studentId,

      studentName: `${updatedEntry.StudentResult.Student.user.firstName} ${updatedEntry.StudentResult.Student.user.lastName}`,

      courseId: updatedEntry.courseId,
      courseName: updatedEntry.Course.name,
      department: updatedEntry.Course.department,

      caScore: Number(updatedEntry.caScore),
      examScore: Number(updatedEntry.examScore),
      totalScore: Number(updatedEntry.totalScore),

      grade: updatedEntry.grade,
      status: updatedEntry.status,

      flag: updatedEntry.flag,
      flagDescription: updatedEntry.flagDescription,
    },
  };
};



export const unflagResultEntry = async (
  entryId: number,
  studentId: number,
  schoolId: number
) => {
  const entry = await prisma.resultEntry.findUnique({
    where: {
      id: entryId,
    },

    include: {
      StudentResult: {
        include: {
          Student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  schoolId: true,
                },
              },
            },
          },
        },
      },

      Course: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error("Result entry not found");
  }

  if (entry.StudentResult.studentId !== studentId) {
    throw new Error("You are not authorized to unflag this result");
  }

  if (entry.StudentResult.Student.user.schoolId !== schoolId) {
    throw new Error("Result does not belong to your school");
  }

  if (entry.flag === ResultFlag.NOT_FLAGGED) {
    throw new Error("This result is not flagged");
  }

  const updatedEntry = await prisma.resultEntry.update({
    where: {
      id: entryId,
    },

    data: {
      flag: ResultFlag.NOT_FLAGGED,
      flagDescription: null,
    },

    include: {
      StudentResult: {
        include: {
          Student: {
            include: {
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
      },

      Course: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
  });

  return {
    entry: {
      id: updatedEntry.id,

      studentId: updatedEntry.StudentResult.studentId,

      studentName: `${updatedEntry.StudentResult.Student.user.firstName} ${updatedEntry.StudentResult.Student.user.lastName}`,

      courseId: updatedEntry.courseId,
      courseName: updatedEntry.Course.name,
      department: updatedEntry.Course.department,

      caScore: Number(updatedEntry.caScore),
      examScore: Number(updatedEntry.examScore),
      totalScore: Number(updatedEntry.totalScore),

      grade: updatedEntry.grade,
      status: updatedEntry.status,

      flag: updatedEntry.flag,
      flagDescription: updatedEntry.flagDescription,
    },
  };
};