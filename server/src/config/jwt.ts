import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const JWT_SECRET = process.env.JWT_SECRET || 'cbcc_nghia_lam_super_secure_secret_key_2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
