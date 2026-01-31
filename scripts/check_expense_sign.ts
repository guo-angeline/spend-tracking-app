
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const expenseTxs = await prisma.transaction.findMany({
        where: { type: 'EXPENSE' },
        take: 5
    });

    console.table(expenseTxs.map(tx => ({
        Description: tx.description,
        Amount: tx.amount,
        Type: tx.type
    })));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
