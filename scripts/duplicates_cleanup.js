
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Clean Up duplicates...");

    const bankItems = await prisma.bankItem.findMany({
        orderBy: { createdAt: 'asc' } // Oldest first
    });

    const map = {};
    for (const item of bankItems) {
        if (!map[item.institutionName]) map[item.institutionName] = [];
        map[item.institutionName].push(item);
    }

    for (const [name, items] of Object.entries(map)) {
        if (items.length > 1) {
            console.log(`Found duplicates for ${name} (${items.length} total)`);

            // Keep the first one (oldest), delete the rest
            const survivor = items[0];
            const doomed = items.slice(1);

            console.log(`  Keeping: ${survivor.id} (Created: ${survivor.createdAt})`);

            for (const d of doomed) {
                console.log(`  Deleting: ${d.id} (Created: ${d.createdAt})...`);
                await prisma.bankItem.delete({
                    where: { id: d.id }
                });
                console.log(`    Deleted.`);
            }
        } else {
            console.log(`${name}: No duplicates.`);
        }
    }

    console.log("Cleanup finished.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
