
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const crypto = require('crypto');

const prisma = new PrismaClient();

// --- Encryption Setup ---
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
    const keyStr = process.env.ENCRYPTION_KEY;
    if (!keyStr) throw new Error('ENCRYPTION_KEY not set');
    return Buffer.from(keyStr, 'hex');
}

function decrypt(encryptedData) {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encryptedText) throw new Error('Invalid encrypted data format');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// --- Plaid Setup ---
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});
const plaidClient = new PlaidApi(configuration);

// --- Sync Logic ---
async function main() {
    console.log("Starting Fix Sync...");
    const bankItems = await prisma.bankItem.findMany({
        include: { accounts: true }
    });

    console.log(`Found ${bankItems.length} bank items.`);

    for (const item of bankItems) {
        console.log(`\n--- Syncing Item: ${item.institutionName} (${item.id}) ---`);
        try {
            const accessToken = decrypt(item.plaidAccessToken);

            let cursor = undefined;
            let added = [];
            let modified = [];
            let removed = [];
            let hasMore = true;

            // 1. Fetch all pages
            console.log("Fetching pages from Plaid...");
            while (hasMore) {
                const response = await plaidClient.transactionsSync({
                    access_token: accessToken,
                    cursor: cursor,
                });
                const data = response.data;
                added = added.concat(data.added);
                modified = modified.concat(data.modified);
                removed = removed.concat(data.removed);
                hasMore = data.has_more;
                cursor = data.next_cursor;
                console.log(`  Fetched page. Total added so far: ${added.length}`);
            }

            console.log(`Fetch complete. Saving to database...`);

            // 2. Save to DB
            let savedCount = 0;

            // Process in chunks or one by one to avoid massive transaction if needed, 
            // but for now let's use a simpler loop than the service code.

            for (const pt of added) {
                const internalAccount = item.accounts.find(
                    (a) => a.plaidAccountId === pt.account_id
                );

                if (!internalAccount) {
                    console.log(`  Skipping transaction ${pt.transaction_id}: No matching account ${pt.account_id}`);
                    continue;
                }

                const transactionData = {
                    amount: pt.amount,
                    description: pt.name,
                    date: new Date(pt.date),
                    userId: item.userId,
                    accountId: internalAccount.id,
                    pending: pt.pending,

                    // Enhanced Metadata
                    merchantName: pt.merchant_name ?? null,
                    logoUrl: pt.logo_url ?? null,
                    website: pt.website ?? null,
                    plaidCategory: pt.category ? JSON.stringify(pt.category) : null,
                    paymentChannel: pt.payment_channel ?? null,
                    location: pt.location ? JSON.stringify(pt.location) : null,
                    authorizedDate: pt.authorized_date ? new Date(pt.authorized_date) : null,
                    isoCurrencyCode: pt.iso_currency_code ?? null,
                };

                await prisma.transaction.upsert({
                    where: { plaidTransactionId: pt.transaction_id },
                    update: transactionData,
                    create: {
                        ...transactionData,
                        plaidTransactionId: pt.transaction_id,
                    },
                });
                savedCount++;
            }

            console.log(`Successfully saved ${savedCount} transactions.`);

        } catch (error) {
            console.error("Error syncing item:", error.response ? JSON.stringify(error.response.data) : error.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
