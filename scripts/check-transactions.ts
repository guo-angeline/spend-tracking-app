import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const transactions = await prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            description: true,
            amount: true,
            categoryId: true, // Internal Category ID
            category: { select: { name: true } }, // Internal Category Name
            personalFinanceCategory: true, // New Plaid Field
        }
    })

    console.log('Recent 10 Transactions:')
    console.table(transactions)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
