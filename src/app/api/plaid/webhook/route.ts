import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { plaidClient } from '@/lib/plaid';
import { syncPlaidTransactions } from '@/lib/plaid-sync-service';
import { jwtVerify, importJWK } from 'jose';

// Verify the webhook came from Plaid using their JWT-based verification
async function verifyPlaidWebhook(request: NextRequest, rawBody: string): Promise<boolean> {
  try {
    const signedJwt = request.headers.get('Plaid-Verification');
    if (!signedJwt) return false;

    // Decode header to get key_id
    const [headerB64] = signedJwt.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const keyId = header.kid;
    if (!keyId) return false;

    // Fetch verification key from Plaid
    const keyResponse = await plaidClient.webhookVerificationKeyGet({ key_id: keyId });
    const jwk = keyResponse.data.key;

    // Import and verify
    const publicKey = await importJWK(jwk as Parameters<typeof importJWK>[0]);
    const { payload } = await jwtVerify(signedJwt, publicKey, { algorithms: ['ES256'] });

    // Verify the body hash matches
    const crypto = await import('crypto');
    const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    return (payload as any).request_body_sha256 === bodyHash;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const isValid = await verifyPlaidWebhook(request, rawBody);
    if (!isValid) {
      console.error('Plaid webhook verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { webhook_type, webhook_code, item_id } = JSON.parse(rawBody);

    if (
      webhook_type === 'TRANSACTIONS' &&
      (webhook_code === 'SYNC_UPDATES_AVAILABLE' || webhook_code === 'DEFAULT_UPDATE')
    ) {
      const bankItem = await prisma.bankItem.findUnique({ where: { plaidItemId: item_id } });
      if (bankItem) {
        await syncPlaidTransactions(bankItem.id);
      }
    } else if (webhook_type === 'ITEM' && webhook_code === 'ITEM_ACCESS_TOKEN_INVALIDATED') {
      const bankItem = await prisma.bankItem.findUnique({ where: { plaidItemId: item_id } });
      if (bankItem) {
        await prisma.bankItem.delete({ where: { id: bankItem.id } });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', (error as Error).message);
    return NextResponse.json({ received: true });
  }
}
