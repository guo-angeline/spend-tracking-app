import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PLAID_TO_INTERNAL_CATEGORY_MAP } from '../src/lib/category-mapping'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting category backfill...')

    const allCategories = await prisma.spendCategory.findMany()
    if (allCategories.length === 0) {
        console.error('No SpendCategory rows found. Run the migration first.')
        process.exit(1)
    }
    console.log(`Loaded ${allCategories.length} categories.`)

    const transactions = await prisma.transaction.findMany({
        where: {
            categoryId: null,
            personalFinanceCategory: { not: null },
        },
        select: { id: true, personalFinanceCategory: true },
    })
    console.log(`Found ${transactions.length} uncategorized transactions with PFC data.`)

    let updated = 0
    let skipped = 0

    for (const tx of transactions) {
        let pfc: { detailed?: string } | null = null
        try {
            pfc = JSON.parse(tx.personalFinanceCategory as string)
        } catch {
            skipped++
            continue
        }

        const detailed = pfc?.detailed
        if (!detailed) { skipped++; continue }

        const categoryName = PLAID_TO_INTERNAL_CATEGORY_MAP[detailed]
        if (!categoryName) { skipped++; continue }

        const category = allCategories.find((c) => c.name === categoryName)
        if (!category) { skipped++; continue }

        await prisma.transaction.update({
            where: { id: tx.id },
            data: { categoryId: category.id },
        })
        updated++
    }

    console.log(`Done. Updated: ${updated}, skipped (no mapping): ${skipped}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
