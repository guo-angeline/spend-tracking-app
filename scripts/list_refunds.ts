
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Listing 'Smart Summed' Refund Transactions (Negative Expenses)...");

    const refunds = await prisma.transaction.findMany({
        where: {
            type: 'EXPENSE',
            amount: { lt: 0 }
        },
        include: {
            category: true
        },
        orderBy: { date: 'desc' }
    });

    if (refunds.length === 0) {
        console.log("No negative expense transactions found.");
    } else {
        console.table(refunds.map(tx => ({
            Date: tx.date.toISOString().split('T')[0],
            Description: tx.description,
            Amount: tx.amount,
            Type: tx.type,
            Category: tx.category?.name || 'N/A'
        })));
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
