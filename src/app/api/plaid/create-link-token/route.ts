import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { Products, CountryCode, LinkTokenCreateRequest } from 'plaid';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth) return unauthorized();

    const linkTokenParams: LinkTokenCreateRequest = {
      user: { client_user_id: auth.userId },
      client_name: 'Piggy Bank',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const redirectUri = process.env.PLAID_REDIRECT_URI;
    const isDevelopment = process.env.PLAID_ENV === 'development';
    const isProduction = process.env.PLAID_ENV === 'production';

    if (redirectUri) {
      if (redirectUri.startsWith('https://') || (!isDevelopment && !isProduction)) {
        linkTokenParams.redirect_uri = redirectUri;
      }
    }

    if (process.env.PLAID_WEBHOOK_URL) {
      linkTokenParams.webhook = process.env.PLAID_WEBHOOK_URL;
    }

    const createTokenResponse = await plaidClient.linkTokenCreate(linkTokenParams);

    return NextResponse.json(createTokenResponse.data);
  } catch (error: unknown) {
    const plaidError = (error as { response?: { data: unknown } }).response?.data;
    console.error('Error creating link token:', plaidError ?? (error as Error).message);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
