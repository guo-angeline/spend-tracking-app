import { NextResponse } from 'next/server';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';

export async function POST(request: Request) {
    try {
        const { bankItemId } = await request.json();

        if (!bankItemId) {
            return NextResponse.json({ error: 'Bank Item ID is required' }, { status: 400 });
        }

        const stats = await syncPlaidTransactions(bankItemId);

        return NextResponse.json({ success: true, ...stats });
    } catch (error: any) {
        console.error('Error syncing transactions:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to sync transactions' },
            { status: 500 }
        );
    }
}
