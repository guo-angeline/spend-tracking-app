
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bankItems = await prisma.bankItem.findMany({
        include: {
            accounts: {
                include: {
                    _count: {
                        select: { transactions: true }
                    }
                }
            }
        }
    });

    console.log("Bank Items Found:", bankItems.length);
    bankItems.forEach(item => {
        console.log(`\nBank Item: ${item.institutionName} (ID: ${item.id})`);
        console.log(`Status: ${item.status}`);
        console.log(`Created At: ${item.createdAt}`);
        console.log(`Accounts:`);
        item.accounts.forEach(acc => {
            console.log(`  - ${acc.name} (${acc.mask}): ${acc._count.transactions} transactions`);
        });
    });

    if (bankItems.length === 0) {
        console.log("No bank items found. The link process might have failed to save to DB.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
