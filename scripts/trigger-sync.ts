import { PrismaClient } from '@prisma/client';
import { syncPlaidTransactions } from '../src/lib/plaid-sync-service';
import 'dotenv/config';

const prisma = new PrismaClient();

async function triggerSync() {
    const authProviderId = 'demo-user-123';

    console.log(`Looking up user: ${authProviderId}...`);
    const user = await prisma.user.findUnique({
        where: { authProviderId },
        include: { bankItems: true }
    });

    if (!user) {
        console.error('User not found.');
        return;
    }

    console.log(`Found user ${user.email} with ${user.bankItems.length} bank items.`);

    for (const item of user.bankItems) {
        console.log(`Syncing item: ${item.institutionName} (${item.id})...`);
        try {
            const stats = await syncPlaidTransactions(item.id);
            console.log(`✅ Sync complete. Added: ${stats.added}, Modified: ${stats.modified}, Removed: ${stats.removed}`);
        } catch (error: any) {
            console.error(`❌ Sync failed for item ${item.id}:`, error.message);
        }
    }
}

triggerSync()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
