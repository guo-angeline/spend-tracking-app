
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting category cleanup...');

    // 1. Fetch all categories
    const categories = await prisma.spendCategory.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Group by name
    const nameMap = {};
    categories.forEach(c => {
        if (!nameMap[c.name]) nameMap[c.name] = [];
        nameMap[c.name].push(c);
    });

    // 3. Process each group
    for (const name of Object.keys(nameMap)) {
        const group = nameMap[name];
        if (group.length <= 1) continue;

        console.log(`Processing "${name}" (${group.length} instances)...`);

        // Pick survivor (first one, which is oldest due to sorting)
        const survivor = group[0];
        const doomed = group.slice(1);
        const doomedIds = doomed.map(d => d.id);

        // 4. Update transactions to point to survivor
        const updateResult = await prisma.transaction.updateMany({
            where: {
                categoryId: { in: doomedIds }
            },
            data: {
                categoryId: survivor.id
            }
        });

        console.log(`  Updated ${updateResult.count} transactions to use ID ${survivor.id}`);

        // 5. Delete doomed categories
        const deleteResult = await prisma.spendCategory.deleteMany({
            where: {
                id: { in: doomedIds }
            }
        });

        console.log(`  Deleted ${deleteResult.count} duplicate categories`);
    }

    console.log('Cleanup finished!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
