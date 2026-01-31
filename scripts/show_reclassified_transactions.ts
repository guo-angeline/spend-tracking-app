
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const category = await prisma.spendCategory.findUnique({
        where: { name: "Credit Card Payment" },
        include: {
            transactions: {
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!category || category.transactions.length === 0) {
        console.log("No 'Credit Card Payment' transactions found.");
        return;
    }

    console.log(`Transactions in category '${category.name}' (Type: TRANSFER):`);
    console.table(category.transactions.map(tx => ({
        Date: tx.date.toISOString().split('T')[0],
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
