import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';

export async function POST(request: Request) {
    try {
        const { publicToken, userId, institutionName } = await request.json();

        if (!publicToken || !userId) {
            return NextResponse.json({ error: 'Public token and user ID are required' }, { status: 400 });
        }

        // Exchange the public token for an access token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Encrypt the access token
        const encryptedAccessToken = encrypt(accessToken);

        // Fetch accounts for this item to save them to the DB
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken,
        });

        const accounts = accountsResponse.data.accounts;

        // Check if BankItem already exists for this institution and user
        const existingBankItem = await prisma.bankItem.findFirst({
            where: {
                userId,
                institutionName
            }
        });

        const bankItem = await prisma.$transaction(async (tx) => {
            let item;

            if (existingBankItem) {
                // Update existing item
                item = await tx.bankItem.update({
                    where: { id: existingBankItem.id },
                    data: {
                        plaidAccessToken: encryptedAccessToken,
                        plaidItemId: itemId,
                        status: 'active'
                    }
                });
            } else {
                // Create new item
                item = await tx.bankItem.create({
                    data: {
                        userId,
                        plaidAccessToken: encryptedAccessToken,
                        plaidItemId: itemId,
                        institutionName: institutionName || 'Unknown Bank',
                        status: 'active',
                    },
                });
            }

            await Promise.all(
                accounts.map((acc) =>
                    tx.account.upsert({
                        where: { plaidAccountId: acc.account_id },
                        update: {
                            bankItemId: item.id,
                            name: acc.name,
                            mask: acc.mask,
                            type: acc.type,
                            subtype: acc.subtype,
                        },
                        create: {
                            bankItemId: item.id,
                            plaidAccountId: acc.account_id,
                            name: acc.name,
                            mask: acc.mask,
                            type: acc.type,
                            subtype: acc.subtype,
                        },
                    })
                )
            );

            return item;
        });

        // Trigger an initial sync immediately after linking
        try {
            console.log(`Triggering initial sync for bankItemId: ${bankItem.id}`);
            await syncPlaidTransactions(bankItem.id);
        } catch (syncError: any) {
            console.error('Initial sync failed:', syncError.message);
            // We don't fail the whole request if just the sync fails, 
            // as the item is already saved and webhooks will pick it up later.
        }

        return NextResponse.json({ success: true, bankItemId: bankItem.id });
    } catch (error: any) {
        console.error('Error exchanging public token:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data || 'Failed to exchange public token' },
            { status: 500 }
        );
    }
}
