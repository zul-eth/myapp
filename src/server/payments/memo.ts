import 'server-only';
import type { MemoKind } from './types';

export function validateMemo(kind: MemoKind, memo: unknown) {
  if (kind === 'NONE') return { ok: true as const };

  if (memo === undefined || memo === null || memo === '') {
    return { ok: false as const, reason: 'Memo/Tag diperlukan' };
  }
  switch (kind) {
    case 'XRP_TAG': {
      const n = Number(memo);
      if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return { ok: false as const, reason: 'Tag XRP harus angka 0..4294967295' };
      return { ok: true as const, value: n };
    }
    case 'EOS_TEXT':
    case 'TON_TEXT': {
      const s = String(memo);
      if (s.length === 0) return { ok: false as const, reason: 'Memo kosong' };
      if (s.length > 128) return { ok: false as const, reason: 'Memo > 128 char' };
      return { ok: true as const, value: s };
    }
    default:
      return { ok: true as const, value: String(memo) };
  }
}