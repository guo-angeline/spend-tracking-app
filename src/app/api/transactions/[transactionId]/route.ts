
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const { transactionId } = await params;
        const { categoryId } = await request.json();

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        if (!categoryId) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: { categoryId },
            include: {
                category: true,
            },
        });

        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error('Error updating transaction category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
