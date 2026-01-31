
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Refund Reclassification (Contra-Expense Logic)...");

    // 1. Find all accounts of type 'credit'
    const creditAccounts = await prisma.account.findMany({
        where: { type: 'credit' }
    });

    const creditAccountIds = creditAccounts.map(a => a.id);
    console.log(`Found ${creditAccountIds.length} credit accounts.`);

    // 2. Find transactions that match Criteria:
    // - Belongs to a credit account
    // - Type is INCOME (currently invalid for Refunds)
    // - Amount is negative (Refunds usually come as negative on credit cards, e.g. -739.45)
    // - NOT "Credit Card Payment" (which we already moved to TRANSFER)

    const refundsToUpdate = await prisma.transaction.findMany({
        where: {
            accountId: { in: creditAccountIds },
            type: 'INCOME',
            category: {
                isNot: { name: 'Credit Card Payment' }
            }
        }
    });

    console.log(`Found ${refundsToUpdate.length} refunds to reclassify as EXPENSE.`);

    if (refundsToUpdate.length > 0) {
        // 3. Update them to EXPENSE
        // Note: We keep the amount negative. e.g. -739.45
        // Dashboard logic will need to sum this negative value to reduce total spend.
        const updateResult = await prisma.transaction.updateMany({
            where: {
                id: { in: refundsToUpdate.map(t => t.id) }
            },
            data: {
                type: 'EXPENSE'
            }
        });

        console.log(`Successfully updated ${updateResult.count} transactions to EXPENSE type.`);
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
