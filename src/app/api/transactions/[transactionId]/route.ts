import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, unauthorized } from '@/lib/auth';

const schema = z.object({
  categoryId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const { transactionId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Verify ownership before updating
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    if (existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId: parsed.data.categoryId },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating transaction category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
