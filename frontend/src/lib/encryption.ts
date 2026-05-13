import CryptoJS from 'crypto-js';

// Simple encryption key (in production, this should be more secure)
const ENCRYPTION_KEY = 'ghost-protocol-ephemeral-2024';

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
};

export const decryptMessage = (encrypted: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted;
  }
};
