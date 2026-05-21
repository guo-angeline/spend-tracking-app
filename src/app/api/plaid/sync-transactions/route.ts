import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';
import { prisma } from '@/lib/prisma';
import { verifyToken, unauthorized } from '@/lib/auth';
import { syncLimiter, checkRateLimit } from '@/lib/ratelimit';

const schema = z.object({
  bankItemId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const limited = await checkRateLimit(syncLimiter, auth.userId);
    if (limited) return limited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bank item ID' }, { status: 400 });
    }

    const bankItem = await prisma.bankItem.findUnique({
      where: { id: parsed.data.bankItemId },
      select: { userId: true },
    });
    if (!bankItem || bankItem.userId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const stats = await syncPlaidTransactions(parsed.data.bankItemId);
    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error('Error syncing transactions:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 });
  }
}
