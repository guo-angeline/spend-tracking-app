import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { Products, CountryCode } from 'plaid';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const linkTokenParams: any = {
            user: { client_user_id: userId },
            client_name: 'Antigravity Finance',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        };

        const redirectUri = process.env.PLAID_REDIRECT_URI;
        const isDevelopment = process.env.PLAID_ENV === 'development';
        const isProduction = process.env.PLAID_ENV === 'production';

        // Plaid requires HTTPS for redirect_uri in Development and Production.
        // It's better to omit it than to send an invalid http:// URI.
        if (redirectUri) {
            if (redirectUri.startsWith('https://') || (!isDevelopment && !isProduction)) {
                linkTokenParams.redirect_uri = redirectUri;
            } else {
                console.warn('Skipping PLAID_REDIRECT_URI because it is not HTTPS while in Development/Production.');
            }
        }

        if (process.env.PLAID_WEBHOOK_URL) {
            linkTokenParams.webhook = process.env.PLAID_WEBHOOK_URL;
        }

        const createTokenResponse = await plaidClient.linkTokenCreate(linkTokenParams);

        return NextResponse.json(createTokenResponse.data);
    } catch (error: any) {
        const plaidError = error.response?.data;
        console.error('Error creating link token:', plaidError || error.message);

        return NextResponse.json(
            {
                error: plaidError?.error_message || plaidError?.error_code || error.message || 'Failed to create link token',
                details: plaidError
            },
            { status: 500 }
        );
    }
}
