// A UUID v7 (RFC 9562): the time in milliseconds, then random bits. The same kind of id as
// public.uuid_generate_v7(), for names the app creates without asking the database.
export function uuidV7(now: number = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const time = now.toString(16).padStart(12, "0");
  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Number.parseInt(time.slice(index * 2, index * 2 + 2), 16);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
