import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    const demoUserEmail = 'demo@example.com'

    // Create Categories
    const categoriesData = [
        // Existing
        { name: 'Housing', icon: '🏠', color: '#ef4444' },
        // Food removed
        { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
        { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
        { name: 'Utilities', icon: '💡', color: '#eab308' },
        { name: 'Income', icon: '💰', color: '#22c55e' },

        // New Personal Finance Categories
        { name: 'Groceries', icon: '🛒', color: '#10b981' },
        { name: 'Dining', icon: '🍽️', color: '#f97316' },
        { name: 'Travel', icon: '✈️', color: '#0ea5e9' },
        { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
        { name: 'Health & Wellness', icon: '❤️', color: '#ef4444' },
        { name: 'Personal Care', icon: '💇', color: '#d946ef' },
        { name: 'Education', icon: '📚', color: '#8b5cf6' },
        { name: 'Subscriptions', icon: '📅', color: '#6366f1' },
        { name: 'Electronics', icon: '💻', color: '#3b82f6' },
        { name: 'Gifts & Donations', icon: '🎁', color: '#f43f5e' },
        { name: 'Services', icon: '🔧', color: '#64748b' },
    ]

    const categories = []
    for (const cat of categoriesData) {
        // Upsert categories to avoid duplicates
        const category = await prisma.spendCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        })
        categories.push(category)
    }

    // Create or Update Demo User (Non-destructive)
    const hashedPassword = await bcrypt.hash('password', 12)
    const demoUser = await prisma.user.upsert({
        where: { email: demoUserEmail },
        update: {}, // Don't change anything if user exists
        create: {
            email: demoUserEmail,
            authProviderId: 'demo-user-123',
            password: hashedPassword,
            name: 'Demo User',
            transactions: {
                create: [
                    // Housing
                    {
                        amount: 1200.00,
                        description: 'Rent',
                        date: new Date(new Date().setDate(1)), // 1st of this month
                        categoryId: categories.find(c => c.name === 'Housing')?.id
                    },
                    // Food replaced by Groceries/Dining
                    {
                        amount: 50.00,
                        description: 'Grocery Store',
                        date: new Date(new Date().setDate(new Date().getDate() - 2)),
                        categoryId: categories.find(c => c.name === 'Groceries')?.id
                    },
                    {
                        amount: 12.50,
                        description: 'Coffee Shop',
                        date: new Date(new Date().setDate(new Date().getDate() - 1)),
                        categoryId: categories.find(c => c.name === 'Dining')?.id
                    },
                    {
                        amount: 45.00,
                        description: 'Dinner out',
                        date: new Date(),
                        categoryId: categories.find(c => c.name === 'Dining')?.id
                    },
                    // Transportation
                    {
                        amount: 40.00,
                        description: 'Gas Station',
                        date: new Date(new Date().setDate(new Date().getDate() - 5)),
                        categoryId: categories.find(c => c.name === 'Transportation')?.id
                    },
                    // Entertainment
                    {
                        amount: 15.00,
                        description: 'Movie Tickets',
                        date: new Date(new Date().setDate(new Date().getDate() - 3)),
                        categoryId: categories.find(c => c.name === 'Entertainment')?.id
                    },
                    // Income
                    {
                        amount: 3500.00,
                        description: 'Salary',
                        date: new Date(new Date().setDate(1)),
                        categoryId: categories.find(c => c.name === 'Income')?.id,
                        type: 'INCOME'
                    },
                    // More 2026-01-01 transactions
                    {
                        amount: 65.00,
                        description: 'New Year Brunch',
                        date: new Date('2026-01-01T11:00:00Z'),
                        categoryId: categories.find(c => c.name === 'Dining')?.id
                    },
                    {
                        amount: 200.00,
                        description: 'Concert Tickets',
                        date: new Date('2026-01-01T20:00:00Z'),
                        categoryId: categories.find(c => c.name === 'Entertainment')?.id
                    },
                    {
                        amount: 45.00,
                        description: 'Gas',
                        date: new Date('2026-01-01T08:00:00Z'),
                        categoryId: categories.find(c => c.name === 'Transportation')?.id
                    },
                ],
            },
        },
    })

    console.log(`Seeding finished. Created user: ${demoUser.email} with ID: ${demoUser.authProviderId}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
