
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Listing Transactions Flagged as INCOME...");

    const incomeTxs = await prisma.transaction.findMany({
        where: {
            OR: [
                { type: 'INCOME' },
                { category: { name: 'Income' } }
            ]
        },
        include: {
            category: true
        },
        orderBy: {
            date: 'desc'
        }
    });

    if (incomeTxs.length === 0) {
        console.log("No transactions found flagged as Income.");
    } else {
        console.table(incomeTxs.map(tx => ({
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
