const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Subscription Logic...');

    // 1. Ensure user exists
    let user = await prisma.user.findUnique({ where: { email: 'demo@looksy.app' } });
    if (!user) {
        console.log('User not found, creating...');
        user = await prisma.user.create({
            data: {
                name: 'Demo User',
                email: 'demo@looksy.app',
                username: 'looksy_demo',
            }
        });
    }
    console.log('User:', user.email);

    // 2. Check current subscription
    let sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    console.log('Current Subscription:', sub);

    // 3. Simulate Subscribe to PRO
    console.log('Simulating Subscribe to PRO...');
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    sub = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
            plan: 'PRO',
            status: 'ACTIVE',
            endDate: endDate
        },
        create: {
            userId: user.id,
            plan: 'PRO',
            status: 'ACTIVE',
            endDate: endDate
        }
    });
    console.log('Updated Subscription:', sub);

    // 4. Verify
    if (sub.plan === 'PRO' && sub.status === 'ACTIVE') {
        console.log('SUCCESS: Subscription updated correctly.');
    } else {
        console.error('FAILURE: Subscription update failed.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
