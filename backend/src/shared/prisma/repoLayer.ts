
import { AccountStatus } from "@prisma/client";

type PrismaModel = {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
};

export const getUserByEmail = async (model: PrismaModel, email: string) => {
    return model.findUnique({
        where: {
            email: email,
        },
    });
}

export const getObjectById = async (model: PrismaModel, id: string) => {
    return model.findUnique({
        where: {
            id: id,
        },
    });
}



export const createObject = async (model: PrismaModel, data: object) => {
    return model.create({
        data: data,
    });
};


export const findAndDeleteByEmail = async (model: PrismaModel, email: string) => {
    return model.delete({
        where: {
            email: email,
        },
    });
};



export const deactivateAccountById = async (model: PrismaModel, id: number) => {
    return model.update({
        where: { id },
        data: { status: AccountStatus.DEACTIVATED },
    });
};

export const getObjectsByField = async (
    model: PrismaModel,
    field: string,
    value: any
) => {
    return model.findMany({
        where: {
            [field]: value,
        },
    });
};