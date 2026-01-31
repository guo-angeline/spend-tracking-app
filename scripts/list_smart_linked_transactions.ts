
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for Linked Refunds...");

    // Fetch ALL transactions ordered by date descending
    const rawTransactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' }
    });

    const matches: any[] = [];

    // Logic mirroring page.tsx
    const adjusted: any[] = rawTransactions.map(t => ({ ...t }));
    const refunds = adjusted.filter(t => t.type === 'REFUND');

    refunds.forEach(refund => {
        const refundAmount = Number(refund.amount);
        const refundDate = new Date(refund.date);

        // Find candidates (Previous expenses from same merchant)
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

        // Sort by date descending (closest to refund first)
        candidateIndices.sort((a: number, b: number) => {
            return new Date(adjusted[b].date).getTime() - new Date(adjusted[a].date).getTime();
        });

        if (candidateIndices.length > 0) {
            const targetIdx = candidateIndices[0];
            const targetTx = adjusted[targetIdx];

            matches.push({
                'Merchant': refund.description,
                'Refund Date': refundDate.toISOString().split('T')[0],
                'Refund Amt': refundAmount,
                'Expense Date': new Date(targetTx.date).toISOString().split('T')[0],
                'Original Exp': Number(targetTx.amount),
                'Net Result': Number(targetTx.amount) + refundAmount
            });

            // Mark as used so we don't use it again? 
            // The current logic in page.tsx effectively "consumes" the expense by modifying it.
            // We should mirror that.
            const newAmount = Number(targetTx.amount) + refundAmount;
            adjusted[targetIdx] = { ...targetTx, amount: newAmount };
        } else {
            // Unmatched refund
        }
    });

    if (matches.length > 0) {
        console.table(matches);
    } else {
        console.log("No linked refunds found.");
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
