import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectMetadata() {
    const user = await prisma.user.findUnique({
        where: { authProviderId: 'demo-user-123' }
    });

    if (!user) return;

    const transactions = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            merchantName: { not: null } // Only show enriched ones
        },
        take: 10,
        orderBy: { date: 'desc' },
        select: {
            description: true,
            merchantName: true,
            logoUrl: true,
            amount: true,
            category: true, // Internal category
            plaidCategory: true, // New raw JSON
            location: true,
            paymentChannel: true
        }
    });

    console.log(`Found ${transactions.length} enriched transactions. Here are the top 10:`);
    console.table(transactions.map(t => ({
        Desc: t.description,
        Merchant: t.merchantName,
        Logo: t.logoUrl ? '✅ Yes' : '❌ No',
        Amount: t.amount,
        Channel: t.paymentChannel,
        Location: t.location ? '✅ Yes' : '❌ No'
    })));
}

inspectMetadata()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
