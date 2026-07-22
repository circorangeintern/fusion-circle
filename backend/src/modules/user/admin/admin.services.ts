import { prisma } from "../../../shared/prisma/prisma";
import { Prisma } from "@prisma/client";
import { updateObject } from "../../../shared/prisma/repoLayer"

type CreateSchoolInput = {
    schoolName: string;
    address?: string;
    state?: string;
    country?: string;
    caWeight?: number;
    examWeight?: number;
    createdById: number;
};


export const createSchoolService = async (input: CreateSchoolInput, data: any) => {

    return prisma.$transaction(async (tx) => {
        const newSchool = await tx.school.create({
            data: {
                pin: data.pin,
                name: input.schoolName,
                address: input.address,
                state: input.state,
                country: input.country,
                caWeight: input.caWeight ?? 30,
                examWeight: input.examWeight ?? 70,
                createdById: data.userId,
            },
        });

        await tx.user.update({
            where: { id: data.userId },
            data: { schoolId: newSchool.id },
        });

        return newSchool;
    });
};


export const updateSchoolService = async (pin: string, data: object) => {
    try {
        const result = await updateObject(
            prisma.school,
            { pin },
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
                message: "The school with the provided pin does not exist.",
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