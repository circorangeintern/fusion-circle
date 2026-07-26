import { prisma } from "../../../shared/prisma/prisma";
import { Prisma } from "@prisma/client";
import { updateObject, getObjectsByField } from "../../../shared/prisma/repoLayer"
type CreateSchoolInput = {
    name: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    schoolType: "UNIVERSITY" | "SECONDARY_SCHOOL";
    description?: string;
};

export const createSchoolService = async (
    input: CreateSchoolInput,
    data: { pin: string; userId: number }
) => {
    return prisma.$transaction(async (tx) => {
        const newSchool = await tx.school.create({
            data: {
                pin: data.pin,
                name: input.name,
                email: input.email,
                website: input.website,
                address: input.address,
                city: input.city,
                state: input.state,
                country: input.country,
                schoolType: input.schoolType,
                description: input.description,
                createdById: data.userId,
            },
        });

        await tx.user.update({
            where: { id: data.userId },
            data: {
                schoolId: newSchool.id,
            },
        });

        return newSchool;
    });
};


export const updateSchoolService = async (id: number, data: object) => {
    try {
        const result = await updateObject(
            prisma.school,
            { id },
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


export const readSchoolService = async (id: number) => {
    try {
        const school = await getObjectsByField(prisma.school, "createdById", id);
        if (!school[0]) {
            return {
                success: false as const,
                statusCode: 404,
                code: "NOT_FOUND",
                message: "You do not manage any school",
                error: null,
            };
        }

        return {
            success: true as const,
            code: "OK",
            message: "School fetched successfully",
            data: school
        };
    } catch (error) {
        return {
            success: false as const,
            statusCode: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to read school.",
            error: error
        };
    }
}