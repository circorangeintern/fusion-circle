/*
  Warnings:

  - You are about to drop the column `caWeight` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `examWeight` on the `School` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolType` to the `School` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `School` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `School` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `School` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('UNIVERSITY', 'SECONDARY_SCHOOL');

-- AlterTable
ALTER TABLE "School" DROP COLUMN "caWeight",
DROP COLUMN "examWeight",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "schoolType" "SchoolType" NOT NULL,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "School_email_key" ON "School"("email");
