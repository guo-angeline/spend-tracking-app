import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken, unauthorized } from '@/lib/auth';
import { insightLimiter, checkRateLimit } from '@/lib/ratelimit';

const querySchema = z.object({
  month: z.coerce.number().int().min(0).max(11),
  year: z.coerce.number().int().min(2020).max(2030),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const limited = await checkRateLimit(insightLimiter, auth.userId);
    if (limited) return limited;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic not configured' }, { status: 500 });
    }
    const anthropic = new Anthropic({ apiKey });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const parsed = querySchema.safeParse({
      month: searchParams.get('month') ?? now.getUTCMonth(),
      year: searchParams.get('year') ?? now.getUTCFullYear(),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }
    const { month, year } = parsed.data;

    const existing = await prisma.insight.findFirst({
      where: { userId: auth.userId, month, year, type: 'MONTHLY_ROAST' },
    });
    if (existing) {
      return NextResponse.json({ content: existing.content, cached: true });
    }

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));

    const transactions = await prisma.transaction.findMany({
      where: { userId: auth.userId, date: { gte: startDate, lte: endDate }, type: 'EXPENSE' },
      include: { category: true },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        content: "You haven't spent anything yet. Are you even living, or just hibernating to save money?",
        cached: false,
      });
    }

    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const cat = t.category?.name ?? 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(t.amount);
    });
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => `${name}: $${amount.toFixed(0)}`)
      .join(', ');

    const merchantTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const merch = t.merchantName ?? t.description;
      merchantTotals[merch] = (merchantTotals[merch] ?? 0) + Number(t.amount);
    });
    const topMerchants = Object.entries(merchantTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => `${name}: $${amount.toFixed(0)}`)
      .join(', ');

    const prompt = `You are a blunt, no-nonsense financial analyst with a dry sense of humor.
The user has spent $${totalSpent.toFixed(2)} this month.
Top categories: ${topCategories}.
Top merchants: ${topMerchants}.

Write a VERY concise insight (2 sentences max).
1. Point out exactly WHERE they are wasting money (be specific based on the data).
2. Throw a playful jab or harsh truth about it.

Do NOT be flowery. Do NOT use hashtags. Do NOT use emojis.
Focus on the numbers and the behavior.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      system: 'You are a sarcastic financial assistant.',
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = message.content[0];
    const generatedText = firstBlock.type === 'text' ? firstBlock.text : 'Spending looks... interesting.';

    await prisma.insight.create({
      data: { userId: auth.userId, month, year, content: generatedText, type: 'MONTHLY_ROAST' },
    });

    return NextResponse.json({ content: generatedText, cached: false });
  } catch (error) {
    console.error('Error generating insight:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
