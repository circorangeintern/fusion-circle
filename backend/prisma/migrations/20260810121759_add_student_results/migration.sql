-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "ResultFlag" AS ENUM ('FLAGGED', 'NOT_FLAGGED');

-- CreateTable
CREATE TABLE "StudentResult" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultEntry" (
    "id" SERIAL NOT NULL,
    "studentResultId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "caScore" DECIMAL(5,2) NOT NULL,
    "examScore" DECIMAL(5,2) NOT NULL,
    "totalScore" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "status" "ResultStatus" NOT NULL,
    "flag" "ResultFlag" NOT NULL DEFAULT 'NOT_FLAGGED',

    CONSTRAINT "ResultEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "StudentResult_studentId_idx" ON "StudentResult"("studentId");

-- CreateIndex
CREATE INDEX "ResultEntry_courseId_idx" ON "ResultEntry"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultEntry_studentResultId_courseId_key" ON "ResultEntry"("studentResultId", "courseId");

-- CreateIndex
CREATE INDEX "_CourseToStudent_B_index" ON "_CourseToStudent"("B");

-- AddForeignKey
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultEntry" ADD CONSTRAINT "ResultEntry_studentResultId_fkey" FOREIGN KEY ("studentResultId") REFERENCES "StudentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultEntry" ADD CONSTRAINT "ResultEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD CONSTRAINT "_CourseToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD CONSTRAINT "_CourseToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
