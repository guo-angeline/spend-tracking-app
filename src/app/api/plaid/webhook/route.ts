import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { webhook_type, webhook_code, item_id } = body;

        console.log(`Received Plaid Webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`);

        if (webhook_type === 'TRANSACTIONS' &&
            (webhook_code === 'SYNC_UPDATES_AVAILABLE' || webhook_code === 'DEFAULT_UPDATE')) {

            // Find the BankItem associated with this Plaid item_id
            const bankItem = await prisma.bankItem.findUnique({
                where: { plaidItemId: item_id },
            });

            if (bankItem) {
                console.log(`Triggering background sync for bankItemId: ${bankItem.id}`);
                await syncPlaidTransactions(bankItem.id);
            }
        } else if (webhook_type === 'ITEM' && webhook_code === 'ITEM_ACCESS_TOKEN_INVALIDATED') {
            console.log(`Received ITEM_ACCESS_TOKEN_INVALIDATED for item ${item_id}`);

            // Find and delete the BankItem. Cascading delete will remove Accounts and Transactions.
            const bankItem = await prisma.bankItem.findUnique({
                where: { plaidItemId: item_id },
            });

            if (bankItem) {
                console.log(`Removing revoked BankItem: ${bankItem.id}`);
                await prisma.bankItem.delete({
                    where: { id: bankItem.id },
                });
                console.log(`Successfully removed BankItem ${bankItem.id} and associated data.`);
            } else {
                console.log(`BankItem not found for item_id: ${item_id}, skipping deletion.`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        // Always return 200 to Plaid to acknowledge receipt, even if processing fails internally
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
