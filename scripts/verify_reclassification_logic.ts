
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Chart Logic Compatibility...");

    const ccCategory = await prisma.spendCategory.findUnique({
        where: { name: "Credit Card Payment" },
        include: { transactions: true }
    });

    if (!ccCategory || ccCategory.transactions.length === 0) {
        console.log("No transactions found in 'Credit Card Payment' category to verify.");
        return;
    }

    const sampleTx = ccCategory.transactions[0];
    console.log(`Sample Transaction: ${sampleTx.description}, Type: ${sampleTx.type}, Category: ${ccCategory.name}`);

    // Simulate MonthlyFinancialsChart Logic
    // It should IGNORE transfers for both Income and Spending bars
    const isIncludedInIncome = sampleTx.type === 'INCOME';
    const isIncludedInSpending = sampleTx.type === 'EXPENSE';

    console.log(`\nMonthly Financials Chart Check:`);
    console.log(`- Counts as Income? ${isIncludedInIncome} (Should be false)`);
    console.log(`- Counts as Expense? ${isIncludedInSpending} (Should be false)`);

    // Simulate CategoryDistributionChart Logic
    // It filters out type 'INCOME' and 'TRANSFER'
    const isExcludedGeneric = sampleTx.type === 'INCOME' || sampleTx.type === 'TRANSFER';
    const isExcludedByName = ccCategory.name === 'Income' || ccCategory.name === 'Transfer';

    console.log(`\nCategory Distribution Chart Check:`);
    console.log(`- Verify logic excludes it? ${isExcludedGeneric || isExcludedByName} (Should be true)`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
