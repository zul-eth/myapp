import 'server-only';
import { ENV } from '@/config/env';

// Satu pintu akses mnemonic agar mudah diaudit & diganti (KMS, vault, dsb).
export function getMnemonic(): string {
  return ENV.MNEMONIC;
}