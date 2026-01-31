import 'dotenv/config';
import { plaidClient } from '../src/lib/plaid';
import { Products, CountryCode } from 'plaid';

async function validate() {
    console.log('--- PLAID CONFIGURATION VALIDATION ---');
    console.log('Environment:', process.env.PLAID_ENV);
    console.log('Client ID:', process.env.PLAID_CLIENT_ID ? 'Set (starts with ' + process.env.PLAID_CLIENT_ID.substring(0, 5) + '...)' : 'MISSING');
    console.log('Secret:', process.env.PLAID_SECRET ? 'Set' : 'MISSING');

    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET || !process.env.PLAID_ENV) {
        console.error('❌ Error: Missing Plaid credentials in .env');
        process.exit(1);
    }

    try {
        console.log('\nAttempting to create a test Link Token...');
        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id: 'test_user_id' },
            client_name: 'Antigravity Finance Test',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        });

        if (response.data.link_token) {
            console.log('✅ Success: Plaid API connected and link_token generated.');
            console.log('Link Token:', response.data.link_token.substring(0, 10) + '...');
        } else {
            console.log('❌ Failure: Plaid API connected but no link_token returned.');
            process.exit(1);
        }
    } catch (error: any) {
        console.error('❌ Error: Plaid API connection failed.');
        if (error.response?.data) {
            console.error('Plaid Error Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        process.exit(1);
    }
}

validate();
