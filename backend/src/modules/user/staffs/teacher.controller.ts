
import { Request, Response } from 'express';
import { prisma } from "../../../shared/prisma/prisma";
import { ResultFlag , NotificationType } from "@prisma/client";
import { getTeacherCourses, getCourseStudents } from './teacher.service';
import {
  bulkUploadResults,
  updateResultEntry,
  getCourseResults,
  getStudentResults,
} from './teacher.service';
import { safeLogAudit } from '../../../utils/auditLogger';



export const getTeacherCoursesController = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);

  try {
    const result = await getTeacherCourses(teacherId, schoolId);

    void safeLogAudit({
      userId: teacherId,
      action: "TEACHER_COURSES_VIEWED",
      entityType: "TEACHER",
      entityId: teacherId,
      details: {
        schoolId,
        totalCourses: result.totalCourses,
        totalStudents: result.totalStudents,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Teacher courses fetched successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "getTeacherCoursesController failed");

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
      message: "Failed to fetch teacher courses",
      data: null,
    });
  }
};

export const getCourseStudentsController = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const courseId = parseInt(req.params.courseId);
  const { search, department, year, class: classFilter } = req.query;

  if (isNaN(courseId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid course ID",
      data: null,
    });
  }

  try {
    const result = await getCourseStudents(
      courseId,
      teacherId, 
      schoolId,
      {
        search: search as string,
        department: department as string,
        year: year as string,
        class: classFilter as string,
      }
    );

    void safeLogAudit({
      userId: teacherId,
      action: "TEACHER_COURSE_STUDENTS_VIEWED",
      entityType: "COURSE",
      entityId: courseId,
      details: {
        schoolId,
        courseId,
        search,
        department,
        year,
        class: classFilter,
        totalStudents: result.total,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Course students fetched successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "getCourseStudentsController failed");

    if (error instanceof Error) {
      if (error.message === 'Course not found or you are not assigned to this course') {
        return res.status(403).json({
          success: false,
          code: "FORBIDDEN",
          message: error.message,
          data: null,
        });
      }

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
      message: "Failed to fetch course students",
      data: null,
    });
  }
};


export const bulkUploadResultsController = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const courseId = parseInt(req.params.courseId);
  const { results } = req.body;

  if (isNaN(courseId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid course ID",
      data: null,
    });
  }

  try {
    const result = await bulkUploadResults(
      courseId,
      teacherId,
      schoolId,
      results
    );

    // Audit log
    await safeLogAudit({
      userId: teacherId,
      action: "BULK_UPLOAD_RESULTS",
      entityType: "RESULT_ENTRY",
      entityId: courseId,
      details: {
        courseId,
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));


    const notifications = result.results.map((studentResult) => ({
  userId: studentResult.studentId,
  type: NotificationType.RESULT_PUBLISHED,
  title: "Result Published",
  message: `Your result for ${result.course.name} has been published.`,
  entityType: "RESULT_ENTRY",
  entityId: studentResult.entryId,
}));

void prisma.notification.createMany({
  data: notifications,
}).catch((error) => {
  req.log.error(
    {
      error,
      courseId: result.course.id,
    },
    "Failed to create result notifications"
  );
});
    const statusCode = result.failed > 0 && result.successful > 0 ? 207 : 200;
    const message = result.failed > 0
      ? `Uploaded ${result.successful} results, ${result.failed} failed`
      : `Successfully uploaded ${result.successful} results`;

    return res.status(statusCode).json({
      success: result.failed === 0,
      code: result.failed > 0 && result.successful > 0 ? "PARTIAL_SUCCESS" : "OK",
      message,
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "bulkUploadResultsController failed");

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
      message: "Failed to upload results",
      data: null,
    });
  }
};


export const updateResultEntryController = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const entryId = parseInt(req.params.entryId);
  const { caScore, examScore, flag } = req.body;

  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid entry ID",
      data: null,
    });
  }

  try {
    const result = await updateResultEntry(
      entryId,
      teacherId,
      schoolId,
      { caScore, examScore, flag }
    );

    await safeLogAudit({
      userId: teacherId,
      action: "UPDATE_RESULT_ENTRY",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: { entryId, caScore, examScore, flag },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));


    const notification = {
  userId: result.entry.studentId,
  type: NotificationType.RESULT_PUBLISHED,
  title: "Result Updated",
  message: `Your result for ${result.entry.courseName} has been updated.`,
  entityType: "RESULT_ENTRY",
  entityId: result.entry.id,
};

void prisma.notification.create({
  data: notification,
}).catch((error) => {
  req.log.error(
    {
      error,
      entryId: result.entry.id,
    },
    "Failed to create result update notification"
  );
});
    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Result entry updated successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "updateResultEntryController failed");

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
      message: "Failed to update result entry",
      data: null,
    });
  }
};


export const getCourseResultsController = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const courseId = parseInt(req.params.courseId);
  const { studentId, status, grade } = req.query;

  if (isNaN(courseId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid course ID",
      data: null,
    });
  }

  try {
    const result = await getCourseResults(
      courseId,
      teacherId,
      schoolId,
      {
        studentId: studentId ? parseInt(studentId as string) : undefined,
        status: status as string,
        grade: grade as string,
      }
    );

    void safeLogAudit({
      userId: teacherId,
      action: "TEACHER_COURSE_RESULTS_VIEWED",
      entityType: "COURSE",
      entityId: courseId,
      details: {
        schoolId,
        courseId,
        studentId,
        status,
        grade,
        totalEntries: result.totalEntries,
        filteredEntries: result.filteredEntries,
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Course results fetched successfully",
      data: result,
    });

  } catch (error) {
    req.log.error({ error }, "getCourseResultsController failed");

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
      message: "Failed to fetch course results",
      data: null,
    });
  }
};

export const getStudentResultsController = async (req: Request, res: Response) => {
  const schoolId = Number(req.user!.schoolId);
  const studentId = parseInt(req.params.studentId);

  if (isNaN(studentId)) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Invalid student ID",
      data: null,
    });
  }

  try {
    const result = await getStudentResults(studentId, schoolId);

    void safeLogAudit({
      userId: req.user!.id,
      action: "TEACHER_STUDENT_RESULTS_VIEWED",
      entityType: "STUDENT",
      entityId: studentId,
      details: {
        schoolId,
        studentId,
        totalCourses: result.results.reduce((sum, r) => sum + r.totalCourses, 0),
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

export const getTeacherFlaggedResultsController = async (
  req: Request,
  res: Response
) => {
  const teacherId = req.user!.id;
  const schoolId = req.user!.schoolId;

  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "School ID not found for teacher",
      data: null,
    });
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: teacherId,
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

    if (!teacher) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Teacher not found",
        data: null,
      });
    }

    const flaggedEntries = await prisma.resultEntry.findMany({
      where: {
        flag: ResultFlag.FLAGGED,
        Course: {
          schoolId,
          teachers: {
            some: {
              userId: teacherId,
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
      orderBy: {
        StudentResult: {
          updatedAt: "desc",
        },
      },
    });

    const formattedEntries = flaggedEntries.map((entry) => ({
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

      resolutionDescription: entry.resolutionDescription,
      resolvedAt: entry.resolvedAt,
      isResolved: entry.resolvedAt !== null,

      submittedAt: entry.StudentResult.createdAt,
      updatedAt: entry.StudentResult.updatedAt,
    }));

    const resolved = formattedEntries.filter(
      (entry) => entry.isResolved
    ).length;

    const unresolved = formattedEntries.filter(
      (entry) => !entry.isResolved
    ).length;

    void safeLogAudit({
      userId: teacherId,
      action: "VIEW_FLAGGED_RESULTS",
      entityType: "TEACHER",
      entityId: teacherId,
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
        teacher: {
          id: teacher.userId,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          email: teacher.user.email,
        },
        summary: {
          totalFlagged: formattedEntries.length,
          resolved,
          unresolved,
        },
        flaggedEntries: formattedEntries,
      },
    });
  } catch (error) {
    req.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        teacherId,
        schoolId,
      },
      "getTeacherFlaggedResultsController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flagged results",
      data: null,
    });
  }
};

export const getTeacherFlaggedEntryByIdController = async (
  req: Request,
  res: Response
) => {
  const teacherId = req.user!.id;
  const schoolId = req.user!.schoolId;
  const entryId = Number(req.params.entryId);

  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "School ID not found for teacher",
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
        Course: {
          schoolId,
          teachers: {
            some: {
              userId: teacherId,
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

      resolutionDescription: entry.resolutionDescription,
      resolvedAt: entry.resolvedAt,
      isResolved: entry.resolvedAt !== null,

      submittedAt: entry.StudentResult.createdAt,
      updatedAt: entry.StudentResult.updatedAt,
    };

    void safeLogAudit({
      userId: teacherId,
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
        teacherId,
        schoolId,
        entryId,
      },
      "getTeacherFlaggedEntryByIdController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flagged entry",
      data: null,
    });
  }
};

export const resolveFlaggedEntryController = async (
  req: Request,
  res: Response
) => {
  const teacherId = req.user!.id;
  const schoolId = req.user!.schoolId;
  const entryId = Number(req.params.entryId);
  const { resolutionDescription } = req.body;

  if (!schoolId) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "School ID not found for teacher",
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

  if (
    typeof resolutionDescription !== "string" ||
    !resolutionDescription.trim()
  ) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Resolution description is required",
      data: null,
    });
  }

  const description = resolutionDescription.trim();

  try {
    const entry = await prisma.resultEntry.findFirst({
      where: {
        id: entryId,
        flag: ResultFlag.FLAGGED,
        Course: {
          schoolId,
          teachers: {
            some: {
              userId: teacherId,
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

    if (entry.resolvedAt) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: "This result has already been resolved",
        data: null,
      });
    }

    const resolvedAt = new Date();

    const updatedEntry = await prisma.resultEntry.update({
      where: {
        id: entryId,
      },
      data: {
        resolutionDescription: description,
        resolvedAt,
      },
      include: {
        Course: {
          select: {
            id: true,
            name: true,
            department: true,
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


    // Notify student that their flagged result has been resolved
void prisma.notification.create({
  data: {
    userId: updatedEntry.StudentResult.studentId,
    type: NotificationType.RESULT_FLAG_RESOLVED,
    title: "Result Flag Resolved",
    message: `Your flagged result for ${updatedEntry.Course.name} has been resolved by your lecturer.`,
    entityType: "RESULT_ENTRY",
    entityId: updatedEntry.id,
  },
}).catch((error) => {
  req.log.error(
    {
      error,
      entryId: updatedEntry.id,
      studentId: updatedEntry.StudentResult.studentId,
    },
    "Failed to create result resolution notification"
  );
});

    await safeLogAudit({
      userId: teacherId,
      action: "RESOLVE_FLAGGED_RESULT",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: {
        resolutionDescription: description,
        resolvedAt: resolvedAt.toISOString(),
      },
    }).catch((error) => {
      req.log.error({ error }, "Failed to create audit log for result resolution");
    });

    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Flagged entry resolved successfully",
      data: {
        entryId: updatedEntry.id,

        studentId: updatedEntry.StudentResult.studentId,
        studentName: `${updatedEntry.StudentResult.Student.user.firstName} ${updatedEntry.StudentResult.Student.user.lastName}`,
        regNo: updatedEntry.StudentResult.Student.regNo,
        email: updatedEntry.StudentResult.Student.user.email,

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

        resolutionDescription: updatedEntry.resolutionDescription,
        resolvedAt: updatedEntry.resolvedAt,
        isResolved: true,
      },
    });
  } catch (error) {
    req.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        teacherId,
        schoolId,
        entryId,
      },
      "resolveFlaggedEntryController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to resolve flagged entry",
      data: null,
    });
  }
};

export const reopenFlaggedResultController = async (
  req: Request,
  res: Response
) => {
  const teacherId = req.user!.id;
  const schoolId = Number(req.user!.schoolId);
  const entryId = Number(req.params.entryId);

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
        Course: {
          schoolId,
          teachers: {
            some: {
              userId: teacherId,
            },
          },
        },
      },
      select: {
        id: true,
        courseId: true,
        studentResultId: true,
        flagDescription: true,
        resolutionDescription: true,
        resolvedAt: true,
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Flagged result not found or you do not have access",
        data: null,
      });
    }

    // The teacher cannot reopen something that has not been resolved.
    if (!entry.resolvedAt) {
      return res.status(400).json({
        success: false,
        code: "NOT_RESOLVED",
        message: "This flagged result has not been resolved",
        data: null,
      });
    }

    // Remove ONLY the teacher's resolution.
    // The student's flag remains FLAGGED.
    const updatedEntry = await prisma.resultEntry.update({
      where: {
        id: entryId,
      },
      data: {
        resolutionDescription: null,
        resolvedAt: null,
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
            studentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Audit the action.
    await safeLogAudit({
      userId: teacherId,
      action: "REOPEN_FLAGGED_RESULT",
      entityType: "RESULT_ENTRY",
      entityId: entryId,
      details: {
        courseId: entry.courseId,
        studentResultId: entry.studentResultId,
        previousResolution: entry.resolutionDescription,
        previousResolvedAt: entry.resolvedAt,
        action: "Teacher removed the resolution. Student flag remains active.",
      },
    }).catch((err) => req.log.error({ err }, "Audit log failed"));

    void prisma.notification.create({
  data: {
    userId: updatedEntry.StudentResult.studentId,
    type: NotificationType.RESULT_REOPENED,
    title: "Result Resolution Reopened",
    message: `The resolution for your flagged result in ${updatedEntry.Course.name} has been reopened by your lecturer.`,
    entityType: "RESULT_ENTRY",
    entityId: updatedEntry.id,
  },
}).catch((error) => {
  req.log.error(
    {
      error,
      entryId: updatedEntry.id,
      studentId: updatedEntry.StudentResult.studentId,
    },
    "Failed to create result reopen notification"
  );
});
    return res.status(200).json({
      success: true,
      code: "OK",
      message: "Result resolution reopened successfully",
      data: {
        entryId: updatedEntry.id,
        courseId: updatedEntry.courseId,
        courseName: updatedEntry.Course.name,
        department: updatedEntry.Course.department,
        year: updatedEntry.Course.year,
        class: updatedEntry.Course.class,
        flag: ResultFlag.FLAGGED,
        flagDescription: entry.flagDescription,
        resolutionDescription: updatedEntry.resolutionDescription,
        resolvedAt: updatedEntry.resolvedAt,
        isResolved: false,
      },
    });
  } catch (error) {
    req.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        teacherId,
        schoolId,
        entryId,
      },
      "reopenFlaggedResultController failed"
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to reopen flagged result",
      data: null,
    });
  }
};

