import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, unauthorized } from '@/lib/auth';

const schema = z.object({
  monthlyBudget: z.number().positive().max(1_000_000).optional(),
  name: z.string().min(1).max(100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: parsed.data,
      select: { id: true, email: true, name: true, authProviderId: true, monthlyBudget: true } as const,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
