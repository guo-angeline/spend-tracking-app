
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting deletion of mock transactions...");

    const whereClause = {
        plaidTransactionId: null
    };

    const count = await prisma.transaction.count({ where: whereClause });
    console.log(`Found ${count} transactions to delete.`);

    if (count > 0) {
        const deleted = await prisma.transaction.deleteMany({
            where: whereClause
        });
        console.log(`Successfully deleted ${deleted.count} transactions.`);
    } else {
        console.log("No transactions found to delete.");
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
