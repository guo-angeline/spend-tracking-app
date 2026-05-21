import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create a user
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            authProviderId: `auth-test-${Date.now()}`,
            password: 'placeholder-hashed-password',
            name: 'Test User',
            transactions: {
                create: {
                    amount: 50.00,
                    description: 'Test Transaction',
                    date: new Date(),
                },
            },
        },
        include: {
            transactions: true,
        },
    })

    console.log('Created user with transaction:', user)

    // Verify can query
    const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { transactions: true },
    })

    if (foundUser?.email === user.email) {
        console.log('Verification Successful: User retrieved correctly.')
    } else {
        console.error('Verification Failed: User not found or mismatch.')
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
