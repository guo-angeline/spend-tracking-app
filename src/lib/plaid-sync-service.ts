import { prisma } from './prisma';
import { plaidClient } from './plaid';
import { decrypt } from './encryption';
import { RemovedTransaction, Transaction as PlaidTransaction } from 'plaid';
import { PLAID_TO_INTERNAL_CATEGORY_MAP } from './category-mapping';

export async function syncPlaidTransactions(bankItemId: string) {
    const bankItem = await prisma.bankItem.findUnique({
        where: { id: bankItemId },
        include: { accounts: true },
    });

    if (!bankItem) {
        throw new Error('Bank item not found');
    }

    // Prefetch all internal categories for mapping
    const allCategories = await prisma.spendCategory.findMany();

    const accessToken = decrypt(bankItem.plaidAccessToken);

    // In a real app, you'd store the 'cursor' to only fetch new changes
    // For this implementation, we'll fetch from the beginning (or a reasonable history)
    // or use the 'cursor' if we decide to add it to the BankItem model.

    let cursor = undefined; // We could add this to the BankItem schema later
    let added: PlaidTransaction[] = [];
    let modified: PlaidTransaction[] = [];
    let removed: RemovedTransaction[] = [];
    let hasMore = true;

    while (hasMore) {
        const response = await plaidClient.transactionsSync({
            access_token: accessToken,
            cursor: cursor,
        });

        added = added.concat(response.data.added);
        modified = modified.concat(response.data.modified);
        removed = removed.concat(response.data.removed);
        hasMore = response.data.has_more;
        cursor = response.data.next_cursor;
    }

    // Process synchronization
    await prisma.$transaction(async (tx) => {
        // 1. Remove transactions
        if (removed.length > 0) {
            await tx.transaction.deleteMany({
                where: {
                    plaidTransactionId: { in: removed.map((r) => r.transaction_id!) },
                },
            });
        }

        // 2. Add / Update transactions
        const allChanges = [...added, ...modified];

        for (const pt of allChanges) {
            const internalAccount = bankItem.accounts.find(
                (a) => a.plaidAccountId === pt.account_id
            );

            if (!internalAccount) continue;

            const transactionData: any = {
                amount: pt.amount,
                description: pt.name,
                date: new Date(pt.date),
                type: pt.amount < 0 ? 'INCOME' :
                    (['wealthfront', 'apple card', 'payment', 'transfer', 'credit card'].some(k => pt.name.toLowerCase().includes(k))) ? 'TRANSFER' :
                        'EXPENSE',
                userId: bankItem.userId,
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
                personalFinanceCategory: pt.personal_finance_category ? JSON.stringify(pt.personal_finance_category) : null,
            };

            // Determine Internal Category
            let categoryId = null;
            if (pt.personal_finance_category?.detailed) {
                const mappedName = PLAID_TO_INTERNAL_CATEGORY_MAP[pt.personal_finance_category.detailed];
                if (mappedName) {
                    const matchedCat = allCategories.find(c => c.name === mappedName);
                    if (matchedCat) {
                        categoryId = matchedCat.id;
                        if (mappedName === 'Income') {
                            transactionData.type = 'INCOME';
                        }
                    }
                }
            }

            await tx.transaction.upsert({
                where: { plaidTransactionId: pt.transaction_id },
                update: { ...transactionData, categoryId }, // Update categoryId if processing updates
                create: {
                    ...transactionData,
                    plaidTransactionId: pt.transaction_id,
                    categoryId // Set categoryId on creation
                },
            });
        }

        // Update the cursor in the future if we add it to the schema
    });

    return { added: added.length, modified: modified.length, removed: removed.length };
}
