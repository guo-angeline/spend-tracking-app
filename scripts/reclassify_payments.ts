
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Credit Card Payment Reclassification...");

    // 1. Ensure Category Exists
    let category = await prisma.spendCategory.findUnique({
        where: { name: "Credit Card Payment" }
    });

    if (!category) {
        console.log("Creating 'Credit Card Payment' category...");
        category = await prisma.spendCategory.create({
            data: {
                name: "Credit Card Payment",
                icon: "💳",
                color: "#6B7280" // Gray-500
            }
        });
    } else {
        console.log("Found existing 'Credit Card Payment' category.");
    }

    // 2. Find Transactions to Update
    // Common patterns for CC payments
    const searchPatterns = [
        "AUTOMATIC PAYMENT",
        "PAYMENT - THANK YOU",
        "MOBILE PAYMENT - THANK YOU",
        "Payment Thank You"
    ];

    const transactionsToUpdate = await prisma.transaction.findMany({
        where: {
            OR: searchPatterns.map(pattern => ({
                description: { contains: pattern }
            })),
            // Only update if not already correct to allow re-running safely
            NOT: {
                AND: [
                    { type: "TRANSFER" },
                    { categoryId: category.id }
                ]
            }
        }
    });

    console.log(`Found ${transactionsToUpdate.length} transactions to reclassify.`);

    if (transactionsToUpdate.length > 0) {
        const updateResult = await prisma.transaction.updateMany({
            where: {
                id: { in: transactionsToUpdate.map(t => t.id) }
            },
            data: {
                type: "TRANSFER",
                categoryId: category.id
            }
        });
        console.log(`Successfully updated ${updateResult.count} transactions.`);
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
