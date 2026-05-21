import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken, unauthorized } from '@/lib/auth';

const schema = z.object({
  date: z.string().datetime({ message: 'Invalid date format' }),
  description: z.string().min(1).max(200),
  // Plaid convention: positive = expense, negative = refund/income
  amount: z.number().finite().refine((n) => n !== 0, 'Amount cannot be zero'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER', 'REFUND']),
  categoryId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { date, description, amount, type, categoryId } = parsed.data;

    // Store as positive for EXPENSE/TRANSFER, negative for INCOME/REFUND
    // to match Plaid convention (positive = money out, negative = money in)
    const storedAmount =
      type === 'INCOME' || type === 'REFUND' ? -Math.abs(amount) : Math.abs(amount);

    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        date: new Date(date),
        description,
        amount: storedAmount,
        type,
        categoryId: categoryId ?? null,
        merchantName: description,
        paymentChannel: 'MANUAL',
        isoCurrencyCode: 'USD',
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating manual transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
