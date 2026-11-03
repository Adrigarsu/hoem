// What a profile photo may be (FR-ACC-007). Checked in the browser, to explain the problem before
// sending the file, and again in the service, whatever the client did (NFR-SEC-002).
export const maxAvatarBytes = 2 * 1024 * 1024;
export const avatarAccept = "image/jpeg,image/png";
// How many bytes avatarRejection needs to recognise a type.
export const avatarHeadBytes = 8;

export type AvatarRejection = "tooLarge" | "wrongType";

const signatures = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
];

// By the first bytes, not the name or the declared type, which the client chooses.
function isAllowedImage(head: Uint8Array): boolean {
  return signatures.some((signature) => signature.every((byte, index) => head[index] === byte));
}

export function avatarRejection(file: { size: number; head: Uint8Array }): AvatarRejection | null {
  if (file.size > maxAvatarBytes) return "tooLarge";
  return isAllowedImage(file.head) ? null : "wrongType";
}
