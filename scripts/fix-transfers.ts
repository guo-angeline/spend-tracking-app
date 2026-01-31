
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Applying Transfer Fixes...')

    // 1. Ensure "Transfer" Category Exists
    let transferCategory = await prisma.spendCategory.findUnique({
        where: { name: 'Transfer' }
    })

    if (!transferCategory) {
        console.log('Creating Transfer Category...')
        transferCategory = await prisma.spendCategory.create({
            data: {
                name: 'Transfer',
                icon: 'arrows-right-left', // using a generic icon string or emoji
                color: '#6B7280' // Gray
            }
        })
    } else {
        console.log('Transfer Category already exists.')
    }

    // 2. Fix specific known outliers (Wealthfront, Apple Card, etc.)
    // We'll search for typical transfer keywords in 'description' or 'merchantName'
    // for transactions that are currently EXPENSE or Uncategorized

    const keywords = ['Wealthfront', 'Apple Card', 'Payment', 'Transfer', 'Credit Card']

    const potentialTransfers = await prisma.transaction.findMany({
        where: {
            type: { not: 'INCOME' }, // Don't touch income
            OR: keywords.map(k => ({
                description: { contains: k }
            }))
        }
    })

    console.log(`Found ${potentialTransfers.length} potential transfers to fix.`)

    let updatedCount = 0
    for (const tx of potentialTransfers) {
        // Double check logic: If it's a "Payment" it might be "Credit Card Payment" -> Transfer
        // If it's "Wealthfront" -> Transfer (likely)

        // We update them to type: TRANSFER and category: Transfer
        await prisma.transaction.update({
            where: { id: tx.id },
            data: {
                type: 'TRANSFER',
                categoryId: transferCategory.id
            }
        })
        updatedCount++
    }

    console.log(`Updated ${updatedCount} transactions to TRANSFER type.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
