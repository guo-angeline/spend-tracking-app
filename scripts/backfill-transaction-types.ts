
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting backfill...')

    const transactions = await prisma.transaction.findMany({
        include: {
            category: true,
        },
    })

    console.log(`Found ${transactions.length} transactions to check.`)

    let updatedCount = 0

    for (const tx of transactions) {
        let type = 'EXPENSE'

        // Check if category is Income
        if (tx.category?.name === 'Income') {
            type = 'INCOME'
        }
        // Fallback: If amount is negative, it's likely a refund or income (Plaid convention: + is expense, - is income)
        // But our seed data might have positive income. 
        // Only trust category 'Income' for now based on seed.
        // However, if we have Plaid data, negative might be income. 
        // Let's stick to: If category is Income OR (amount < 0 and category is not manually set to an expense)
        // For simplicity and safety per plan: Only checks Category name 'Income'.

        // Actually, let's also check if amount < 0 just in case category is missing but it's clearly a credit.
        // But Plaid credits are negative.
        if (Number(tx.amount) < 0 && tx.category?.name !== 'Income') {
            // It might be a refund, which is effectively income or reduced expense. 
            // Let's mark as INCOME if it's negative? 
            // Or just stick to the 'Income' category for the main "Income" bar.
            // Refunds to a credit card (negative expense) should probably not show up as "Income" in a cash flow chart usually, 
            // but rather reduced spending. 
            // BUT, the user wants "Monthly Total Income".
            // The safe bet is strictly the 'Income' category.
        }

        if (tx.type !== type) {
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { type },
            })
            updatedCount++
        }
    }

    console.log(`Backfill complete. Updated ${updatedCount} transactions.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
