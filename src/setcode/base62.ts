// The Set code container: base62 of a big-endian integer whose first byte is
// always 0x01. The marker keeps leading zero bytes and catches most typos.

import { SetCodeError } from './error';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const MARKER = 0x01;

export function bytesToCode(bytes: number[]): string {
  let n = BigInt(MARKER);
  for (const byte of bytes) n = (n << 8n) | BigInt(byte);
  let code = '';
  while (n > 0n) {
    code = ALPHABET[Number(n % 62n)] + code;
    n /= 62n;
  }
  return code;
}

export function codeToBytes(code: string): number[] {
  let n = 0n;
  for (const char of code.trim()) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) throw new SetCodeError('notBase62', `"${char}" is not a base62 character`);
    n = n * 62n + BigInt(digit);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  if (bytes[0] !== MARKER) throw new SetCodeError('badMarker', 'the first byte is not 0x01');
  return bytes.slice(1);
}
