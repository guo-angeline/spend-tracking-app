
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking Bank Items ---");
    const bankItems = await prisma.bankItem.findMany({
        include: { accounts: true }
    });

    // Group by institution
    const map = {};
    for (const item of bankItems) {
        if (!map[item.institutionName]) map[item.institutionName] = [];
        map[item.institutionName].push(item);
    }

    for (const [name, items] of Object.entries(map)) {
        console.log(`Institution: ${name} - Count: ${items.length}`);
        items.forEach(i => {
            console.log(`  ID: ${i.id}, CreatedAt: ${i.createdAt}`);
            console.log(`  Accounts: ${i.accounts.map(a => `${a.name}(${a.mask})`).join(', ')}`);
        });
    }

    console.log("\n--- Checking for Potential Duplicate Transactions ---");
    // Look for transactions with same amount, date, description but different IDs
    // This is expensive on large DBs but fine here.
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        take: 20
    });

    // Simple check: Group by "amount|description|date"
    const dupMap = {};
    for (const t of transactions) {
        const key = `${t.amount}|${t.description}|${t.date.toISOString().split('T')[0]}`;
        if (!dupMap[key]) dupMap[key] = [];
        dupMap[key].push(t);
    }

    let dupCount = 0;
    for (const [key, list] of Object.entries(dupMap)) {
        if (list.length > 1) {
            dupCount++;
            console.log(`Possible Duplicate Key: ${key}`);
            list.forEach(t => console.log(`  ID: ${t.id} (PlaidID: ${t.plaidTransactionId}) AccountID: ${t.accountId}`));
        }
    }

    if (dupCount === 0) console.log("No obvious duplicates found in recent transactions.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
