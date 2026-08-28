const encoder = new TextEncoder();
const PASSWORD_ITERATIONS = 210_000;

function encode(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function randomToken(bytes = 32) {
  return encode(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(value: string) {
  return encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashSecret(secret: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    material,
    256,
  );
  return `pbkdf2$${PASSWORD_ITERATIONS}$${encode(salt)}$${encode(new Uint8Array(bits))}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [algorithm, iterationText, saltText, expectedText] = stored.split("$");
  if (algorithm !== "pbkdf2" || !iterationText || !saltText || !expectedText) return false;
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: decode(saltText), iterations: Number(iterationText) },
    material,
    256,
  ));
  const expected = decode(expectedText);
  if (bits.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < bits.length; index += 1) difference |= bits[index] ^ expected[index];
  return difference === 0;
}
