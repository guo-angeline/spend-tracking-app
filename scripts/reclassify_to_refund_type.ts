
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Refund Reclassification (Type: REFUND)...");

    // 1. Find all accounts of type 'credit'
    const creditAccounts = await prisma.account.findMany({
        where: { type: 'credit' }
    });
    const creditAccountIds = creditAccounts.map(a => a.id);

    // 2. Find transactions that match Criteria:
    // - Belongs to a credit account
    // - Amount is negative (Refunds)
    // - Type is EXPENSE (current state) or INCOME (old state, just in case)
    const refundsToUpdate = await prisma.transaction.findMany({
        where: {
            accountId: { in: creditAccountIds },
            amount: { lt: 0 },
            type: { in: ['EXPENSE', 'INCOME'] },
            category: {
                isNot: { name: 'Credit Card Payment' }
            }
        }
    });

    console.log(`Found ${refundsToUpdate.length} potential refunds.`);

    if (refundsToUpdate.length > 0) {
        const updateResult = await prisma.transaction.updateMany({
            where: {
                id: { in: refundsToUpdate.map(t => t.id) }
            },
            data: {
                type: 'REFUND'
            }
        });
        console.log(`Successfully updated ${updateResult.count} transactions to REFUND type.`);
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
