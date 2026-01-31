
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: { transactions: true }
            }
        }
    });

    console.log("Users found:", JSON.stringify(users, null, 2));

    const recentTransactions = await prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            account: true
        }
    });

    console.log("Recent Transactions:");
    recentTransactions.forEach(t => {
        console.log(`- ${t.description} ($${t.amount}) [${t.account ? t.account.name : 'No Account'}]`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
