
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Verifying Campaign Flow...');

    // 1. Get or Create Business User
    const email = 'business_test@example.com';
    let user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('Creating test business user...');
        user = await prisma.user.create({
            data: {
                email,
                name: 'Business Tester',
                username: 'businesstester',
                isInfluencer: false
            }
        });
    }
    console.log(`✅ Business User: ${user.id}`);

    // 2. Get or Create Store
    let store = await prisma.store.findFirst({
        where: { ownerId: user.id }
    });

    if (!store) {
        console.log('Creating test store...');
        store = await prisma.store.create({
            data: {
                name: 'Test Business Store',
                address: '123 Test Ave',
                lat: -34.6037,
                lng: -58.3816,
                type: 'Boutique',
                ownerId: user.id
            }
        });
    }
    console.log(`✅ Store: ${store.id}`);

    // 3. Test Campaign Creation
    console.log('Creating test campaign...');
    const campaign = await prisma.campaign.create({
        data: {
            title: 'Test Integration Campaign',
            description: 'This is a test campaign created by the verification script.',
            budget: 500,
            requirements: JSON.stringify({ followers: 1000 }),
            reward: 'Free Samples',
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            storeId: store.id
        }
    });
    console.log(`✅ Campaign Created: ${campaign.id}`);

    // 4. Verify Campaigns for store
    const campaignsCount = await prisma.campaign.count({
        where: { storeId: store.id }
    });
    console.log(`✅ Total Campaigns for store: ${campaignsCount}`);

    console.log('\n✨ Verification Successful!');
}

main()
    .catch(e => {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
