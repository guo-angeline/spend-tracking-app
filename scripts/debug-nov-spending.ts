
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Debugging November Spending...')

    // Define November Range (Assuming current relevant year is 2025 based on Jan 2026 current date)
    // Or simply fetch all transactions for "Nov" across years to be safe. 
    // But let's look at the most recent Nov (2025).

    const start = new Date('2025-11-01T00:00:00Z')
    const end = new Date('2025-12-01T00:00:00Z')

    const transactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: start,
                lt: end
            }
        },
        include: {
            category: true
        },
        orderBy: {
            amount: 'desc'
        }
    })

    console.log(`Found ${transactions.length} transactions in Nov 2025.`)

    let totalExpense = 0
    let totalIncome = 0

    console.log('\n--- Top 10 High Value Transactions ---')
    transactions.slice(0, 10).forEach(tx => {
        console.log(`${tx.date.toISOString().split('T')[0]} | ${tx.description.padEnd(30)} | Cat: ${(tx.category?.name || 'Uncategorized').padEnd(15)} | Type: ${tx.type.padEnd(7)} | Amount: ${tx.amount}`)
    })

    console.log('\n--- Aggregation ---')
    for (const tx of transactions) {
        const amount = Number(tx.amount)
        const absAmount = Math.abs(amount)

        // Mimic the Chart Logic:
        let isIncome = false
        let isTransfer = false

        if (tx.type === 'INCOME') {
            isIncome = true
        } else if (tx.type === 'EXPENSE') {
            isIncome = false
        } else if (tx.type === 'TRANSFER') {
            isTransfer = true
        } else {
            if (tx.category?.name === 'Income') isIncome = true
            else if (tx.category?.name === 'Transfer') isTransfer = true
        }

        if (isTransfer) {
            // Do nothing
        } else if (isIncome) {
            totalIncome += absAmount
        } else {
            totalExpense += absAmount
        }
    }

    console.log(`Total Income: $${totalIncome.toFixed(2)}`)
    console.log(`Total Expense: $${totalExpense.toFixed(2)}`)

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
