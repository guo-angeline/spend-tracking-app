
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying manual transaction creation...");

    // 1. Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found to test with.");
        process.exit(1);
    }
    console.log(`Using user: ${user.email} (${user.id})`);

    // 2. Create a manual transaction directly via Prisma to test DB constraints first?
    // No, we want to test the API logic, but we can't easily call Next.js API from a script without running the server.
    // So we will simulate the API logic here to verify the data integrity using the same logic.
    // Or better, let's just create it using Prisma with the payload we expect the API to handle, 
    // to ensure the schema is correct.

    const payload = {
        userId: user.id,
        date: new Date(),
        description: "Manual Verify Transaction",
        amount: 123.45,
        type: "EXPENSE",
        paymentChannel: "MANUAL",
        isoCurrencyCode: "USD"
    };

    try {
        const tx = await prisma.transaction.create({
            data: {
                userId: payload.userId,
                date: payload.date,
                description: payload.description,
                amount: payload.amount,
                type: payload.type,
                paymentChannel: payload.paymentChannel,
                isoCurrencyCode: payload.isoCurrencyCode,
                merchantName: payload.description
            }
        });
        console.log("Successfully created transaction via Prisma:", tx.id);

        // Clean up
        await prisma.transaction.delete({ where: { id: tx.id } });
        console.log("Cleaned up test transaction.");

    } catch (err) {
        console.error("Failed to create transaction:", err);
        process.exit(1);
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
