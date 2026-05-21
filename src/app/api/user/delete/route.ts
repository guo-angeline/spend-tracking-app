import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    await prisma.user.delete({ where: { id: auth.userId } });

    return NextResponse.json({ success: true, message: 'Account and all associated data deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
