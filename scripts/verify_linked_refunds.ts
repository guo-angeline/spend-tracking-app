
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirroring the logic implemented in page.tsx for verification
const getAdjustedTransactions = (rawTransactions: any[]) => {
    const adjusted = rawTransactions.map(t => ({ ...t }));
    const refunds = adjusted.filter(t => t.type === 'REFUND');

    refunds.forEach(refund => {
        const refundAmount = Number(refund.amount);
        const refundDate = new Date(refund.date);

        const candidateIndices = adjusted.reduce((indices: number[], tx: any, idx: number) => {
            if (tx.type !== 'REFUND' &&
                tx.description === refund.description &&
                Number(tx.amount) > 0 &&
                new Date(tx.date) < refundDate
            ) {
                indices.push(idx);
            }
            return indices;
        }, [] as number[]);

        candidateIndices.sort((a: number, b: number) => { // Fixed type error by inferring or standard js
            return new Date(adjusted[b].date).getTime() - new Date(adjusted[a].date).getTime();
        });

        if (candidateIndices.length > 0) {
            const targetIdx = candidateIndices[0];
            const targetTx = adjusted[targetIdx];

            console.log(`[MATCH] Linking Refund of ${refundAmount} (${refundDate.toISOString().split('T')[0]}) to Expense ${targetTx.amount} (${new Date(targetTx.date).toISOString().split('T')[0]})`);

            const originalAmount = Number(targetTx.amount);
            const newAmount = originalAmount + refundAmount;

            adjusted[targetIdx] = {
                ...targetTx,
                amount: newAmount,
                notes: `Adjusted`
            };
            console.log(`  -> New Expense Amount: ${newAmount}`);
        } else {
            console.log(`[NO_MATCH] Unlinked Refund: ${refund.description} (${refundAmount})`);
        }
    });

    return adjusted.filter(t => t.type !== 'REFUND');
};

async function main() {
    console.log("Verifying Linked Refund Logic (Server-Side Simulation)...");

    // Fetch transactions exactly as the API would
    // We need userId for filtering. Picking a user who has these refunds.
    // From previous steps we know userId b1a272ef-359d-4613-b13b-6aeb67204779 has transfers/refunds.
    // Actually, we can just grab ALL transactions for simplifying the test script or grab by known IDs.

    // Let's grab specific test cases: THESOCIALCLUB
    const transactions = await prisma.transaction.findMany({
        where: { description: 'THESOCIALCLUB' },
        orderBy: { date: 'desc' }
    });

    if (transactions.length === 0) {
        console.log("No THESOCIALCLUB transactions found.");
        return;
    }

    console.log("Raw Transactions:");
    console.table(transactions.map(t => ({
        Date: t.date.toISOString().split('T')[0],
        Desc: t.description,
        Amount: Number(t.amount),
        Type: t.type
    })));

    console.log("\n--- Applying Logic ---\n");
    const adjusted = getAdjustedTransactions(transactions);

    console.log("\nAdjusted Transactions (for Charts):");
    console.table(adjusted.map(t => ({
        Date: t.date.toISOString().split('T')[0],
        Desc: t.description,
        Amount: Number(t.amount),
        Type: t.type,
        Notes: t.notes || ''
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
