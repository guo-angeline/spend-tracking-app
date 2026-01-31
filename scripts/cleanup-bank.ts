import { PrismaClient } from '@prisma/client';
import { plaidClient } from '../src/lib/plaid';
import { decrypt } from '../src/lib/encryption';
import 'dotenv/config';

const prisma = new PrismaClient();

async function cleanBankConnections() {
    const authProviderId = 'demo-user-123';

    console.log(`Starting cleanup for user: ${authProviderId}...`);

    const user = await prisma.user.findUnique({
        where: { authProviderId },
        include: { bankItems: true }
    });

    if (!user) {
        console.error('User not found.');
        return;
    }

    console.log(`Found ${user.bankItems.length} bank connections.`);

    for (const item of user.bankItems) {
        try {
            console.log(`Refining Plaid for item: ${item.institutionName} (${item.plaidItemId})...`);

            // 1. Tell Plaid to revoke the access token
            const accessToken = decrypt(item.plaidAccessToken);
            await plaidClient.itemRemove({
                access_token: accessToken,
            });
            console.log('✅ Plaid access revoked.');
        } catch (error: any) {
            console.error(`⚠️ Could not revoke Plaid access (likely already expired or invalid): ${error.message}`);
        }

        // 2. Delete the Item from the DB
        // (Cascading deletes will handle Accounts and Transactions)
        await prisma.bankItem.delete({
            where: { id: item.id }
        });
        console.log('✅ Local database records wiped.');
    }

    console.log('\nCleanup complete! You can now re-link your bank account safely.');
}

cleanBankConnections()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
