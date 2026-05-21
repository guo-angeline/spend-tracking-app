import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categoriesData = [
    { name: 'Housing',           icon: '🏠', color: '#ef4444' },
    { name: 'Transportation',    icon: '🚗', color: '#3b82f6' },
    { name: 'Entertainment',     icon: '🎬', color: '#8b5cf6' },
    { name: 'Utilities',         icon: '💡', color: '#eab308' },
    { name: 'Income',            icon: '💰', color: '#22c55e' },
    { name: 'Groceries',         icon: '🛒', color: '#10b981' },
    { name: 'Dining',            icon: '🍽️',  color: '#f97316' },
    { name: 'Travel',            icon: '✈️',  color: '#0ea5e9' },
    { name: 'Shopping',          icon: '🛍️',  color: '#ec4899' },
    { name: 'Health & Wellness', icon: '❤️',  color: '#ef4444' },
    { name: 'Personal Care',     icon: '💇', color: '#d946ef' },
    { name: 'Education',         icon: '📚', color: '#8b5cf6' },
    { name: 'Subscriptions',     icon: '📅', color: '#6366f1' },
    { name: 'Electronics',       icon: '💻', color: '#3b82f6' },
    { name: 'Gifts & Donations', icon: '🎁', color: '#f43f5e' },
    { name: 'Services',          icon: '🔧', color: '#64748b' },
]

async function main() {
    console.log('Seeding SpendCategory rows...')
    for (const cat of categoriesData) {
        await prisma.spendCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        })
    }
    const count = await prisma.spendCategory.count()
    console.log(`Done. SpendCategory table now has ${count} rows.`)
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
