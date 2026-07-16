import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';




const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter })



// if (!connectionString) {
//     throw new Error('DATABASE_URL is not defined');
// }

// const prisma = new PrismaClient({
//     adapter: new PrismaPg({ connectionString }),
// });

async function main() {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const adminFirstName = process.env.SUPER_ADMIN_FIRST_NAME;

    if (!adminEmail || !adminPassword || !adminFirstName) {
        throw new Error('Missing super admin environment variables.');
    }

    const existingAdmin = await prisma.superAdmin.findUnique({
        where: {
            email: adminEmail,
        },
    });


    if (existingAdmin) {
        console.log('Admin already exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.superAdmin.create({
        data: {
            firstName: adminFirstName,
            email: adminEmail,
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
        },
    });

    console.log('Super admin seeded successfully.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });