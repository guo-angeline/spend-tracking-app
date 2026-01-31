
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.account.findMany();
    console.table(accounts.map(a => ({
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask
    })));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
