/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Users:', users);

    if (users.length === 0) {
        console.log('No users found. Creating user_1...');
        await prisma.user.create({
            data: {
                id: 'user_1',
                name: 'Demo User',
                email: 'demo@looksy.app',
                username: 'looksy_demo',
            }
        });
        console.log('Created user_1');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
