
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const total = await prisma.transaction.count();
    const withPlaidId = await prisma.transaction.count({
        where: {
            plaidTransactionId: {
                not: null
            }
        }
    });
    const withoutPlaidId = await prisma.transaction.count({
        where: {
            plaidTransactionId: null
        }
    });

    console.log(`Total transactions: ${total}`);
    console.log(`With Plaid ID (Real): ${withPlaidId}`);
    console.log(`Without Plaid ID (Mock): ${withoutPlaidId}`);

    // Show a few samples of mock transactions to confirm they are the ones we want to delete
    if (withoutPlaidId > 0) {
        console.log("\nSample Mock Transactions:");
        const samples = await prisma.transaction.findMany({
            where: { plaidTransactionId: null },
            take: 5,
            select: { description: true, date: true, amount: true, type: true }
        });
        console.table(samples);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
