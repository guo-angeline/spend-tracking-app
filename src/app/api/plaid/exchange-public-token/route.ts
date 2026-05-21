import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';
import { verifyToken, unauthorized } from '@/lib/auth';

const schema = z.object({
  publicToken: z.string().min(1),
  institutionName: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { publicToken, institutionName } = parsed.data;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    const encryptedAccessToken = encrypt(accessToken);

    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accounts = accountsResponse.data.accounts;

    const existingBankItem = await prisma.bankItem.findFirst({
      where: { userId: auth.userId, institutionName: institutionName ?? null },
    });

    const bankItem = await prisma.$transaction(async (tx) => {
      let item;
      if (existingBankItem) {
        item = await tx.bankItem.update({
          where: { id: existingBankItem.id },
          data: { plaidAccessToken: encryptedAccessToken, plaidItemId: itemId, status: 'active' },
        });
      } else {
        item = await tx.bankItem.create({
          data: {
            userId: auth.userId,
            plaidAccessToken: encryptedAccessToken,
            plaidItemId: itemId,
            institutionName: institutionName ?? 'Unknown Bank',
            status: 'active',
          },
        });
      }

      await Promise.all(
        accounts.map((acc) =>
          tx.account.upsert({
            where: { plaidAccountId: acc.account_id },
            update: { bankItemId: item.id, name: acc.name, mask: acc.mask, type: acc.type, subtype: acc.subtype },
            create: {
              bankItemId: item.id,
              plaidAccountId: acc.account_id,
              name: acc.name,
              mask: acc.mask,
              type: acc.type,
              subtype: acc.subtype,
            },
          })
        )
      );

      return item;
    });

    try {
      await syncPlaidTransactions(bankItem.id);
    } catch (syncError) {
      console.error('Initial sync failed:', (syncError as Error).message);
    }

    return NextResponse.json({ success: true, bankItemId: bankItem.id });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ error: 'Failed to exchange public token' }, { status: 500 });
  }
}
