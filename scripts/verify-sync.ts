import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({
        where: { authProviderId: 'demo-user-123' }
    });

    if (!user) {
        console.log('User demo-user-123 not found');
        return;
    }

    console.log(`Found User: ${user.email} (ID: ${user.id})`);

    const bankItems = await prisma.bankItem.findMany({
        where: { userId: user.id }
    });
    console.log(`\nBank Items: ${bankItems.length}`);
    bankItems.forEach(bi => console.log(`- ${bi.institutionName} (${bi.plaidItemId})`));

    const accounts = await prisma.account.findMany({
        where: { bankItem: { userId: user.id } }
    });
    console.log(`\nAccounts: ${accounts.length}`);
    accounts.forEach(acc => console.log(`- ${acc.name} (${acc.type}) mask: ${acc.mask}`));

    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 10
    });
    console.log(`\nLatest 10 Transactions for ${user.email}:`);
    console.table(transactions.map(t => ({
        date: t.date.toISOString().split('T')[0],
        amount: t.amount,
        description: t.description,
        pending: t.pending
    })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
