
import { prisma } from "../../../shared/prisma/prisma";
import { ResultStatus, ResultFlag } from '@prisma/client';

export const getTeacherCourses = async (teacherId: number, schoolId: number) => {
  const courses = await prisma.course.findMany({
    where: {
      teachers: {
        some: { userId: teacherId },
      },
      schoolId: schoolId,
      isActive: true,
    },
    include: {
      students: {
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

  return {
    totalCourses: courses.length,
    totalStudents: courses.reduce((sum, course) => sum + course.students.length, 0),
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      department: course.department,
      year: course.year,
      class: course.class,
      isActive: course.isActive,
      stats: {
        totalStudents: course.students.length,
        totalTeachers: course.teachers.length,
      },
      teachers: course.teachers.map((teacher) => ({
        id: teacher.userId,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
      })),
      students: course.students.map((student) => ({
        id: student.userId,
        name: `${student.user.firstName} ${student.user.lastName}`,
        regNo: student.regNo,
        email: student.user.email,
        department: student.department,
        year: student.year,
        class: student.class,
      })),
    })),
  };
};

export const getCourseStudents = async (
  courseId: number,
  teacherId: number,
  schoolId: number,
  filters?: {
    search?: string;
    department?: string;
    year?: string;
    class?: string;
  }
) => {

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      schoolId: schoolId,
      isActive: true,
      teachers: {
        some: { userId: teacherId },
      },
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

  if (!course) {
    throw new Error('Course not found or you are not assigned to this course');
  }

  const where: any = {
    courses: {
      some: { id: courseId },
    },
  };

  if (filters?.search) {
    where.OR = [
      { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      { regNo: { contains: filters.search, mode: 'insensitive' } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters?.department) {
    where.department = filters.department;
  }

  if (filters?.year) {
    where.year = filters.year;
  }

  if (filters?.class) {
    where.class = filters.class;
  }


  const students = await prisma.student.findMany({
    where,
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
    orderBy: {
      user: {
        lastName: 'asc',
      },
    },
  });

  return {
    course: {
      id: course.id,
      name: course.name,
      department: course.department,
      year: course.year,
      class: course.class,
      isActive: course.isActive,
    },
    teachers: course.teachers.map((teacher) => ({
      id: teacher.userId,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
    })),
    students: students.map((student) => ({
      id: student.userId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      regNo: student.regNo,
      email: student.user.email,
      department: student.department,
      year: student.year,
      class: student.class,
    })),
    total: students.length,
  };
};


export const calculateGradeAndStatus = (
  totalScore: number,
  gradingBands: any[],
  passMark: number
) => {

  const band = gradingBands.find(
    (b) => totalScore >= b.min && totalScore <= b.max
  );

  if (!band) {
    throw new Error(`No grading band found for score: ${totalScore}`);
  }

  return {
    grade: band.grade,
    point: band.point,
    status: totalScore >= passMark ? 'PASS' : 'FAIL',
  };
};


export const bulkUploadResults = async (
  courseId: number,
  teacherId: number,
  schoolId: number,
  results: { studentId: number; caScore: number; examScore: number }[]
) => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      schoolId: schoolId,
      isActive: true,
      teachers: {
        some: { userId: teacherId },
      },
    },
    select: {
      id: true,
      name: true,
      department: true,
      year: true,
      class: true,
    },
  });

  if (!course) {
    throw new Error('Course not found or you are not assigned to this course');
  }

  const schoolConfig = await prisma.schoolConfig.findUnique({
    where: { schoolId },
  });

  if (!schoolConfig) {
    throw new Error('School configuration not found');
  }

  const gradingBands = schoolConfig.gradingBands as any[];
  const passMark = (schoolConfig.cgpa as any).passMark;


  const registeredStudents = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      students: {
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

  const registeredStudentIds = new Set(
    registeredStudents?.students.map((s) => s.userId) || []
  );


  const successfulResults = [];
  const failedResults = [];

  for (const result of results) {
    try {
  
      const caScore = Number(result.caScore);
      const examScore = Number(result.examScore);
      const totalScore = caScore + examScore;


      const student = await prisma.student.findUnique({
        where: { userId: result.studentId },
        include: {
          user: true,
        },
      });

      if (!student) {
        failedResults.push({
          studentId: result.studentId,
          reason: 'Student not found',
        });
        continue;
      }

  
      if (!registeredStudentIds.has(result.studentId)) {
        failedResults.push({
          studentId: result.studentId,
          reason: 'Student is not registered for this course',
        });
        continue;
      }


      if (totalScore > 100) {
        failedResults.push({
          studentId: result.studentId,
          reason: 'Total score (CA + Exam) cannot exceed 100',
        });
        continue;
      }

      // Calculate grade and status
      const { grade, status } = calculateGradeAndStatus(
        totalScore,
        gradingBands,
        passMark
      );

      // 5. Find or create StudentResult
      let studentResult = await prisma.studentResult.findFirst({
        where: { studentId: result.studentId },
      });

      if (!studentResult) {
        studentResult = await prisma.studentResult.create({
          data: {
            studentId: result.studentId,
          },
        });
      }
      

      const resultEntry = await prisma.resultEntry.upsert({
        where: {
          studentResultId_courseId: {
            studentResultId: studentResult.id,
            courseId: courseId,
          },
        },
        update: {
          caScore: caScore,
          examScore: examScore,
          totalScore: totalScore,
          grade: grade,
          status: status as ResultStatus, 
    flag: ResultFlag.NOT_FLAGGED,  
        },
        create: {
          studentResultId: studentResult.id,
          courseId: courseId,
          caScore: caScore,
          examScore: examScore,
          totalScore: totalScore,
          grade: grade,
        status: status as ResultStatus, 
        flag: ResultFlag.NOT_FLAGGED,  
        },
      });

      successfulResults.push({
        studentId: result.studentId,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        regNo: student.regNo,
        caScore: caScore,
        examScore: examScore,
        totalScore: totalScore,
        grade: grade,
        status: status,
        entryId: resultEntry.id,
      });

    } catch (error) {
      console.error('Failed to process result:', error);
      failedResults.push({
        studentId: result.studentId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 7. Return summary
  return {
    course: {
      id: course.id,
      name: course.name,
      department: course.department,
      year: course.year,
      class: course.class,
    },
    totalProcessed: results.length,
    successful: successfulResults.length,
    failed: failedResults.length,
    results: successfulResults,
    errors: failedResults.length > 0 ? failedResults : undefined,
  };
};


export const updateResultEntry = async (
  entryId: number,
  teacherId: number,
  schoolId: number,
  data: { caScore?: number; examScore?: number; flag?: string }
) => {
  // 1. Get the result entry
  const entry = await prisma.resultEntry.findUnique({
    where: { id: entryId },
    include: {
      studentResult: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
      course: {
        include: {
          teachers: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error('Result entry not found');
  }

  // 2. Check if teacher is assigned to this course
  const isTeacherAssigned = entry.course.teachers.some(
    (t) => t.userId === teacherId
  );

  if (!isTeacherAssigned) {
    throw new Error('You are not authorized to update this result');
  }

  // 3. Check if school matches
  if (entry.course.schoolId !== schoolId) {
    throw new Error('Result does not belong to your school');
  }

  // 4. Get school config for recalculation
  const schoolConfig = await prisma.schoolConfig.findUnique({
    where: { schoolId },
  });

  if (!schoolConfig) {
    throw new Error('School configuration not found');
  }

  const gradingBands = schoolConfig.gradingBands as any[];
  const passMark = (schoolConfig.cgpa as any).passMark;

  // 5. Prepare update data
  const updateData: any = {};

  if (data.caScore !== undefined) {
    updateData.caScore = data.caScore;
  }

  if (data.examScore !== undefined) {
    updateData.examScore = data.examScore;
  }

  if (data.flag !== undefined) {
    updateData.flag = data.flag;
  }

  
  if (data.caScore !== undefined || data.examScore !== undefined) {

    const caScore = data.caScore !== undefined ? Number(data.caScore) : Number(entry.caScore);
    const examScore = data.examScore !== undefined ? Number(data.examScore) : Number(entry.examScore);
    const totalScore = caScore + examScore;

    if (totalScore > 100) {
      throw new Error('Total score (CA + Exam) cannot exceed 100');
    }

    const { grade, status } = calculateGradeAndStatus(
      totalScore,
      gradingBands,
      passMark
    );

    updateData.totalScore = totalScore;
    updateData.grade = grade;
    updateData.status = status;
  }

  // 7. Update the entry
  const updatedEntry = await prisma.resultEntry.update({
    where: { id: entryId },
    data: updateData,
    include: {
      studentResult: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
      course: true,
    },
  });

  return {
    entry: {
      id: updatedEntry.id,
      studentId: updatedEntry.studentResult.studentId,
      studentName: `${updatedEntry.studentResult.student.user.firstName} ${updatedEntry.studentResult.student.user.lastName}`,
      courseId: updatedEntry.courseId,
      courseName: updatedEntry.course.name,
      caScore: updatedEntry.caScore,
      examScore: updatedEntry.examScore,
      totalScore: updatedEntry.totalScore,
      grade: updatedEntry.grade,
      status: updatedEntry.status,
      flag: updatedEntry.flag,
    },
  };
};

export const getCourseResults = async (
  courseId: number,
  teacherId: number,
  schoolId: number,
  filters?: { studentId?: number; status?: string; grade?: string }
) => {
  // 1. Check if course exists and teacher is assigned
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      schoolId: schoolId,
      isActive: true,
      teachers: {
        some: { userId: teacherId },
      },
    },
    select: {
      id: true,
      name: true,
      department: true,
      year: true,
      class: true,
    },
  });

  if (!course) {
    throw new Error('Course not found or you are not assigned to this course');
  }


  const where: any = {
    courseId: courseId,
  };

  const entries = await prisma.resultEntry.findMany({
    where,
    include: {
      studentResult: {
        include: {
          student: {
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
      studentResult: {
        student: {
          user: {
            lastName: 'asc',
          },
        },
      },
    },
  });


  const results = entries.map((entry) => ({
    id: entry.id,
    studentId: entry.studentResult.studentId,
    studentName: `${entry.studentResult.student.user.firstName} ${entry.studentResult.student.user.lastName}`,
    regNo: entry.studentResult.student.regNo,
    email: entry.studentResult.student.user.email,
    caScore: Number(entry.caScore),
    examScore: Number(entry.examScore),
    totalScore: Number(entry.totalScore),
    grade: entry.grade,
    status: entry.status,
    flag: entry.flag,
    updatedAt: entry.studentResult.updatedAt,
  }));


  let filteredResults = results;
  if (filters?.studentId) {
    filteredResults = filteredResults.filter((r) => r.studentId === filters.studentId);
  }
  if (filters?.status) {
    filteredResults = filteredResults.filter((r) => r.status === filters.status);
  }
  if (filters?.grade) {
    filteredResults = filteredResults.filter((r) => r.grade === filters.grade);
  }

  return {
    course: {
      id: course.id,
      name: course.name,
      department: course.department,
      year: course.year,
      class: course.class,
    },
    totalEntries: results.length,
    filteredEntries: filteredResults.length,
    results: filteredResults,
  };
};


export const getStudentResults = async (
  studentId: number,
  schoolId: number
) => {

  const student = await prisma.student.findUnique({
    where: { userId: studentId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          schoolId : true
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (student.user.schoolId !== schoolId) {
    throw new Error('Student does not belong to your school');
  }


  const studentResults = await prisma.studentResult.findMany({
    where: { studentId },
    include: {
      entries: {
        include: {
          course: {
            select: {
              id: true,
              name: true,
              department: true,
              year: true,
              class: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });


  const formattedResults = studentResults.map((sr) => ({
    resultId: sr.id,
    submittedAt: sr.createdAt,
    updatedAt: sr.updatedAt,
    courses: sr.entries.map((entry) => ({
      courseId: entry.courseId,
      courseName: entry.course.name,
      department: entry.course.department,
      year: entry.course.year,
      class: entry.course.class,
      caScore: Number(entry.caScore),
      examScore: Number(entry.examScore),
      totalScore: Number(entry.totalScore),
      grade: entry.grade,
      status: entry.status,
    })),
    totalCourses: sr.entries.length,
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
  };
};