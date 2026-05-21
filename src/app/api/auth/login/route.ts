import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { loginLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

const schema = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(loginLimiter, getClientIp(request));
    if (limited) return limited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { userId, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { authProviderId: userId } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken(user.id);
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, authProviderId: user.authProviderId, monthlyBudget: user.monthlyBudget },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
