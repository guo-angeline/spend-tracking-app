
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const foodCategory = await prisma.spendCategory.findUnique({
            where: { name: 'Food' },
        });

        if (!foodCategory) {
            console.log('Category "Food" not found.');
            return;
        }

        const diningCategory = await prisma.spendCategory.findUnique({
            where: { name: 'Dining' },
        });

        if (!diningCategory) {
            console.log('Category "Dining" not found. Cannot migrate transactions.');
            return;
        }

        console.log(`Found "Food" category with ID: ${foodCategory.id}`);
        console.log(`Found "Dining" category with ID: ${diningCategory.id}`);

        // Update transactions
        const updateResult = await prisma.transaction.updateMany({
            where: { categoryId: foodCategory.id },
            data: { categoryId: diningCategory.id },
        });

        console.log(`Moved ${updateResult.count} transactions from "Food" to "Dining".`);

        // Delete "Food" category
        await prisma.spendCategory.delete({
            where: { id: foodCategory.id },
        });

        console.log('Successfully deleted "Food" category.');
    } catch (error) {
        console.error('Error removing Food category:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
