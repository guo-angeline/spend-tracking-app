
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.spendCategory.findMany();
    console.log(`Total categories: ${categories.length}`);

    const nameMap = {};
    categories.forEach(c => {
        if (!nameMap[c.name]) nameMap[c.name] = [];
        nameMap[c.name].push(c.id);
    });

    console.log("\nDuplicate Categories:");
    Object.keys(nameMap).forEach(name => {
        if (nameMap[name].length > 1) {
            console.log(`- "${name}": ${nameMap[name].length} instances`);
            console.log(`  IDs: ${JSON.stringify(nameMap[name])}`);
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
