
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const txs = await prisma.transaction.findMany({
        where: {
            description: {
                contains: 'AUTOMATIC PAYMENT'
            }
        },
        include: {
            category: true
        }
    });

    console.log('Found transactions:', JSON.stringify(txs, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
