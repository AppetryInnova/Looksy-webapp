
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    for (const u of users) {
        console.log(`USER: ${u.id} | EMAIL: ${u.email} | NAME: ${u.name}`);
    }

    console.log('--- STORES ---');
    const stores = await prisma.store.findMany();
    for (const s of stores) {
        console.log(`STORE: ${s.id} | NAME: ${s.name} | OWNER_ID: ${s.ownerId}`);
    }

    console.log('--- CAMPAIGNS ---');
    const campaigns = await prisma.campaign.findMany();
    for (const c of campaigns) {
        console.log(`CAMPAIGN: ${c.id} | TITLE: ${c.title} | STORE_ID: ${c.storeId} | STATUS: ${c.status}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
