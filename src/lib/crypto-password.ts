import crypto from 'crypto';

// Reversible encryption configuration
const ALGORITHM = 'aes-256-cbc';
// Fixed 32-byte key for local development consistency
const ENCRYPTION_KEY = Buffer.from('f9fbe3d22b1016834b69d12c8ff46452f1e6378e9bc7e63b65cb4659b8a9179d', 'hex');
const IV_LENGTH = 16;

/**
 * Encrypts a cleartext password to an AES-256 string.
 */
export function encryptPassword(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts an AES-256 encrypted password string back to cleartext.
 * Falls back to the original string if decryption fails (e.g. if it is bcrypt or cleartext).
 */
export function decryptPassword(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length < 2) return encryptedText; // Not encrypted with our custom aes format

    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // If decryption fails, return the original string (supports legacy bcrypt or cleartext passwords)
    return encryptedText;
  }
}
