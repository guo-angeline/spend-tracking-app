import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * The resulting string is formatted as `iv:authTag:encryptedText`.
 */
export function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string formatted as `iv:authTag:encryptedText`.
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encryptedText) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

function getEncryptionKey(): Buffer {
    const keyStr = process.env.ENCRYPTION_KEY;
    if (!keyStr) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Ensure the key is exactly 32 bytes (64 hex characters)
    const key = Buffer.from(keyStr, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
    }

    return key;
}
