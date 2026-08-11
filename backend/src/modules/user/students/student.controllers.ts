// controllers/courseController.ts
import { Request, Response } from 'express';
import { prisma } from "../../../shared/prisma/prisma";
import { Prisma , ResultFlag, ResultStatus, NotificationType  } from '@prisma/client';
import { GetStudentCoursesQueryInput } from '../../../shared/validator/validator';
import { safeLogAudit } from '../../../utils/auditLogger';
import { registerCourses,  getStudentResults,
  flagResultEntry,
  unflagResultEntry,} from './student.service';
import { createNotification } from '../../../shared/notificationService';

import { RegisterCoursesInput } from '../../../shared/validator/validator';




export const getStudentCoursesController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const schoolId = req.user.schoolId;
  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Schoolid not found for the user",
    });
  }
    
  const query = req.query as GetStudentCoursesQueryInput;

  try {
    const where: Prisma.CourseWhereInput = {
      schoolId,
      ...(query.year !== undefined && {
        year: query.year,
      }),
      ...(query.class !== undefined && {
        class: query.class,
      }),
    };

    const courses = await prisma.course.findMany({
      where,
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
      orderBy: {
        name: 'asc',
      },
    });

    void safeLogAudit({
    userId: req.user.id,
    action: "STUDENT_COURSES_VIEWED",
    entityType: "STUDENT",
    entityId: req.user.id,
    details: {
        schoolId,
        filters: query,
        totalCourses: courses.length,
    },
});
    return res.status(200).json({
      success: true,
      code: "OK",
      data: courses,
      total: courses.length,
    });

  } catch (error) {
    req.log.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      schoolId,
      query,
    }, 'Get student courses error');
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch student courses",
    });
  }
};

export const registerCoursesController = async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const { courseIds } = req.body as RegisterCoursesInput;

  try {
    const result = await registerCourses(studentId, schoolId, courseIds);

    // Audit log
    await safeLogAudit({
      userId: req.user!.id,
      action: "REGISTER_COURSES",
      entityType: "STUDENT_COURSE",
      entityId: studentId,
      details: {
        courseIds,
        registeredCount: result.summary.successfullyRegistered,
        invalidCourses: result.summary.invalidCourseIds,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    let message = `Successfully registered ${result.summary.successfullyRegistered} course(s)`;
    if (result.summary.invalidCourses > 0) {
      message += ` (${result.summary.invalidCourses} invalid courses skipped)`;
    }

  const teacherIds = [
  ...new Set(
    result.courses.flatMap((course) =>
      course.teachers.map((teacher) => teacher.user.id)
    )
  ),
];

const notifications = [
  // Student notification
  {
    userId: result.student.id,
    type: NotificationType.COURSE_REGISTERED,
    title: "Course Registration Successful",
    message: `You have successfully registered for ${result.courses.length} course(s).`,
    entityType: "STUDENT",
    entityId: result.student.id,
  },

  // Teacher notifications
  ...teacherIds.map((teacherId) => ({
    userId: teacherId,
    type: NotificationType.COURSE_REGISTERED,
    title: "Student Registered for Course",
    message: `${result.student.name} has registered for the courses you were assigned to.`,
    entityType: "STUDENT",
    entityId: result.student.id,
  })),
];


try {
  await prisma.notification.createMany({
    data: notifications,
  });
} catch (error) {
  req.log.error(
    { error },
    "Failed to create notifications"
  );
}

    return res.status(200).json({
      success: true,
      code: "OK",
      message,
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "registerCoursesController failed");
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to register courses",
      data: null,
    });
  }
};

export const getStudentResultsController = async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const { courseId, status, grade, flagged } = req.query;

  try {
    const result = await getStudentResults(
      studentId,
      schoolId,
      {
        courseId: courseId ? parseInt(courseId as string) : undefined,
        status: status as ResultStatus ,
        grade: grade as string,
        flagged: flagged !== undefined ? flagged === 'true' : undefined,
      }
    );

    void safeLogAudit({
      userId: studentId,
      action: "VIEW_STUDENT_RESULTS",
      entityType: "STUDENT",
      entityId: studentId,
      details: {
        schoolId,
        courseId,
        status,
        grade,
        flagged,
        totalResults: result,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Student results fetched successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "getStudentResultsController failed");

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch student results",
      data: null,
    });
  }
};

export const flagResultController = async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const entryId = parseInt(req.params.entryId);
  const { description } = req.body;

  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid entry ID",
      data: null,
    });
  }

  try {
    const result = await flagResultEntry(
      entryId,
      studentId,
      schoolId,
      description
    );

  const course = await prisma.course.findUnique({
  where: {
    id: result.entry.courseId,
  },
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
});



    await safeLogAudit({
      userId: studentId,
      action: "FLAG_RESULT",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: { description },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

   void createNotification({
  userId: studentId,
  type: NotificationType.RESULT_FLAGGED,
  title: 'Result Flagged',
  message: `You have flagged your result for ${result.entry.courseName}. Your teacher will review it shortly.`,
  entityType: 'ResultEntry',
  entityId: result.entry.id,
}).catch((error) => {
  req.log.error('Failed to create notification:', error);
});

for (const teacher of course?.teachers ?? []) {
  createNotification({
    userId: teacher.userId,
    type: NotificationType.RESULT_FLAGGED,
    title: "Result Flagged",
    message: `${result.entry.studentName} has flagged their result for ${result.entry.courseName}. Please review and resolve.`,
    entityType: "ResultEntry",
    entityId: result.entry.id,
  }).catch((error) => {
    req.log.error({ error, teacherId: teacher.userId }, 'Failed to create teacher notification');
  });
}
    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Result flagged successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "flagResultController failed");

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to flag result",
      data: null,
    });
  }
};


export const unflagResultController = async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const entryId = parseInt(req.params.entryId);

  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid entry ID",
      data: null,
    });
  }

  try {
    const result = await unflagResultEntry(
      entryId,
      studentId,
      schoolId
    );

  const course = await prisma.course.findUnique({
  where: {
    id: result.entry.courseId,
  },
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
});

    await safeLogAudit({
      userId: studentId,
      action: "UNFLAG_RESULT",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: { unflagged: true },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));


createNotification({
  userId: studentId,
  type: NotificationType.RESULT_UNFLAGGED,
  title: 'Flag Removed',
  message: `The flag on your result for ${result.entry.courseName} has been removed.`,
  entityType: 'ResultEntry',
  entityId: result.entry.id,
}).catch((error) => {
  req.log.error('Failed to create notification:', error);
});

for (const teacher of course?.teachers ?? []) {
  createNotification({
    userId: teacher.userId,
    type: NotificationType.RESULT_UNFLAGGED,
    title: "Result Flag Removed",
    message: `${result.entry.studentName}'s flag on ${result.entry.courseName} has been removed.`,
    entityType: "ResultEntry",
    entityId: result.entry.id,
  }).catch((error) => {
    req.log.error({ error, teacherId: teacher.userId }, 'Failed to create teacher notification');
  });
}
    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Result unflagged successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "unflagResultController failed");

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to unflag result",
      data: null,
    });
  }
};


export const getFlaggedResultsController = async (
  req: Request,
  res: Response
) => {
  const studentId = req.user!.id;
  const schoolId = req.user!.schoolId;

  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "School ID not found for user",
      data: null,
    });
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        userId: studentId,
        user: {
          schoolId,
        },
      },
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
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Student not found",
        data: null,
      });
    }

    const flaggedEntries = await prisma.resultEntry.findMany({
      where: {
        flag: ResultFlag.FLAGGED,

        StudentResult: {
          studentId,
        },
      },

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

        StudentResult: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },

      orderBy: {
        StudentResult: {
          updatedAt: "desc",
        },
      },
    });

    const formattedEntries = flaggedEntries.map((entry) => ({
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

      submittedAt: entry.StudentResult.createdAt,
      updatedAt: entry.StudentResult.updatedAt,
    }));

    void safeLogAudit({
      userId: studentId,
      action: "VIEW_FLAGGED_RESULTS",
      entityType: "STUDENT",
      entityId: studentId,
      details: {
        schoolId,
        totalFlagged: formattedEntries.length,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: `Found ${formattedEntries.length} flagged result(s)`,

      data: {
        student: {
          id: student.userId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          regNo: student.regNo,
          email: student.user.email,
        },

        flaggedEntries: formattedEntries,
        total: formattedEntries.length,
      },
    });
  } catch (error) {
    req.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        studentId,
        schoolId,
      },
      "getFlaggedResultsController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flagged results",
      data: null,
    });
  }
};


export const getFlaggedEntryByIdController = async (
  req: Request,
  res: Response
) => {
  const studentId = req.user!.id;
  const schoolId = req.user!.schoolId;
  const entryId = Number(req.params.entryId);

  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "School ID not found for user",
      data: null,
    });
  }

  if (!Number.isInteger(entryId) || entryId <= 0) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid entry ID",
      data: null,
    });
  }

  try {
    const entry = await prisma.resultEntry.findFirst({
      where: {
        id: entryId,
        flag: ResultFlag.FLAGGED,

        StudentResult: {
          studentId,

          Student: {
            user: {
              schoolId,
            },
          },
        },
      },

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
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Flagged entry not found or you do not have access",
        data: null,
      });
    }

    const formattedEntry = {
      entryId: entry.id,

      studentId: entry.StudentResult.studentId,
      studentName: `${entry.StudentResult.Student.user.firstName} ${entry.StudentResult.Student.user.lastName}`,
      regNo: entry.StudentResult.Student.regNo,
      email: entry.StudentResult.Student.user.email,

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

      submittedAt: entry.StudentResult.createdAt,
      updatedAt: entry.StudentResult.updatedAt,
    };

    void safeLogAudit({
      userId: studentId,
      action: "VIEW_FLAGGED_ENTRY",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: {
        schoolId,
        entryId,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Flagged entry retrieved successfully",
      data: formattedEntry,
    });
  } catch (error) {
    req.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        studentId,
        schoolId,
        entryId,
      },
      "getFlaggedEntryByIdController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flagged entry",
      data: null,
    });
  }
};