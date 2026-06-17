// Base64 decoding shared by compileLabDoc (decode for Blobs) and
// loadUntrustedLabDoc (decode for validation). Uses the platform `atob`,
// available in browsers and in Node 18+. Throws on invalid base64; callers in
// the untrusted path must catch.

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  // Back the view with a concrete ArrayBuffer so the result is a valid BlobPart
  // (TS 5.7 typed arrays are generic over ArrayBufferLike, which Blob rejects).
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
