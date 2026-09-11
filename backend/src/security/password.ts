import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';

const KEY_LENGTH = 64;
const N = 16_384;
const R = 8;
const P = 1;

const toBase64 = (value: Uint8Array) =>
  btoa(Array.from(value, (byte) => String.fromCharCode(byte)).join(''));

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

function scrypt(password: string, salt: Uint8Array) {
  return new Promise<Uint8Array>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      { N, r: R, p: P },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${N}$${R}$${P}$${toBase64(salt)}$${toBase64(key)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, n, r, p, saltText, hashText] = encoded.split('$');
  if (
    algorithm !== 'scrypt' ||
    !saltText ||
    !hashText ||
    Number(n) !== N ||
    Number(r) !== R ||
    Number(p) !== P
  )
    return false;
  const expected = fromBase64(hashText);
  const actual = await scrypt(password, fromBase64(saltText));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
