import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- USERS ---')
    const users = await prisma.user.findMany()
    console.table(users)

    console.log('\n--- CATEGORIES ---')
    const categories = await prisma.spendCategory.findMany()
    console.table(categories)

    console.log('\n--- BANK ITEMS ---')
    const bankItems = await prisma.bankItem.findMany()
    console.table(bankItems)

    console.log('\n--- ACCOUNTS ---')
    const accounts = await prisma.account.findMany()
    console.table(accounts)

    console.log('\n--- TRANSACTIONS (First 50) ---')
    const transactions = await prisma.transaction.findMany({
        take: 50,
        include: {
            category: {
                select: { name: true }
            },
            user: {
                select: { email: true }
            }
        },
        orderBy: { date: 'desc' }
    })

    // Flatten for display
    const displayTransactions = transactions.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        amount: t.amount,
        description: t.description,
        category: t.category?.name || 'Uncategorized',
        user: t.user.email
    }))
    console.table(displayTransactions)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
