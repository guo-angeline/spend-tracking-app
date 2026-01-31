import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: { authProviderId: 'demo-user-123' },
        include: { bankItems: true }
    })

    if (!user) {
        console.log('User not found')
        return
    }

    console.log(`User found: ${user.email}`)
    console.log('Bank Items:')
    user.bankItems.forEach(item => {
        console.log(`- ID: ${item.id}, Institution: ${item.institutionName}, Status: ${item.status}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
