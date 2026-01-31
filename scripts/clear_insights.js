
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Clearing Insight cache...");
    try {
        const deleted = await prisma.insight.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} cached insights.`);
    } catch (error) {
        console.error("❌ Error clearing cache:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
