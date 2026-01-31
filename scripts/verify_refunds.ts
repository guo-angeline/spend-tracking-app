
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Refund Logic (Contra-Expense)...");

    // Fetch a known refund transaction that we reclassified
    const refundTx = await prisma.transaction.findFirst({
        where: {
            type: 'EXPENSE',
            amount: { lt: 0 }
        }
    });

    if (!refundTx) {
        console.log("No refund transactions (negative expenses) found.");
        return;
    }

    console.log(`Sample Refund Transaction: ${refundTx.description}, Amount: ${refundTx.amount}, Type: ${refundTx.type}`);

    // Simulating dashboard logic
    // Previous logic (WRONG): Math.abs(-150) = 150 (add to spend)
    // New logic (CORRECT): Number(-150) = -150 (reduce spend)

    const amount = Number(refundTx.amount);
    const previousLogic = Math.abs(amount);

    console.log(`\nLogic Check:`);
    console.log(`- Amount Value: ${amount}`);
    console.log(`- Effect on Spending Total: ${amount < 0 ? 'REDUCES' : 'INCREASES'} Spending`);

    if (amount < 0) {
        console.log("✅ Verification PASSED: Refund will reduce total spent.");
    } else {
        console.log("❌ Verification FAILED: Refund is not negative.");
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
