import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { authProviderId: 'demo-user-123' },
    });
    console.log('User password:', user?.password);
}
main().finally(() => prisma.$disconnect());
