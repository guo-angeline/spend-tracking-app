import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Deleting the user will trigger cascading deletes for:
        // - BankItems (and their plaid access tokens)
        // - Accounts
        // - Transactions
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true, message: 'Account and all associated data deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to delete account' },
            { status: 500 }
        );
    }
}
