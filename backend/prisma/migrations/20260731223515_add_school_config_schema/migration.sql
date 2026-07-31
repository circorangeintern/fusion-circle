-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SchoolConfig" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "gradingBands" JSONB NOT NULL DEFAULT '[{"min":70,"max":100,"grade":"A","point":5},{"min":60,"max":69,"grade":"B","point":4},{"min":50,"max":59,"grade":"C","point":3},{"min":45,"max":49,"grade":"D","point":2},{"min":40,"max":44,"grade":"E","point":1},{"min":0,"max":39,"grade":"F","point":0}]',
    "cgpa" JSONB NOT NULL DEFAULT '{"caWeight":30,"examWeight":70,"passMark":40}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolConfig_schoolId_key" ON "SchoolConfig"("schoolId");

-- AddForeignKey
ALTER TABLE "SchoolConfig" ADD CONSTRAINT "SchoolConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
