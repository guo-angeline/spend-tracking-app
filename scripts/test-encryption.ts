import 'dotenv/config';
import { encrypt, decrypt } from '../src/lib/encryption';
import crypto from 'crypto';

function test() {
    console.log('--- ENCRYPTION TEST ---');

    // Verify that the environment variable is actually set
    if (!process.env.ENCRYPTION_KEY) {
        console.error('❌ Error: ENCRYPTION_KEY is NOT set in your .env file.');
        process.exit(1);
    }
    console.log('✅ ENCRYPTION_KEY detected in environment.');

    const originalText = 'secret-plaid-token-123456';
    console.log('Original Text:', originalText);

    try {
        const encrypted = encrypt(originalText);
        console.log('Encrypted Data:', encrypted);

        const decrypted = decrypt(encrypted);
        console.log('Decrypted Text:', decrypted);

        if (originalText === decrypted) {
            console.log('✅ Success: Decrypted text matches original.');
        } else {
            console.log('❌ Failure: Decrypted text does not match.');
            process.exit(1);
        }

        // Test tampering
        console.log('\n--- TAMPERING TEST ---');
        const parts = encrypted.split(':');
        // Change one character in the encrypted text
        parts[2] = parts[2].substring(0, 5) + (parts[2][5] === '0' ? '1' : '0') + parts[2].substring(6);
        const tampered = parts.join(':');

        try {
            decrypt(tampered);
            console.log('❌ Failure: Decryption succeeded on tampered data (AuthTag failed).');
            process.exit(1);
        } catch (e) {
            console.log('✅ Success: Decryption failed on tampered data as expected.');
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
        process.exit(1);
    }
}

test();
