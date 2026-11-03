import { describe, expect, it } from "vitest";
import { avatarRejection, maxAvatarBytes } from "./avatar-rules";

const jpeg = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0);
const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const pdf = new TextEncoder().encode("%PDF-1.7");

describe("avatarRejection", () => {
  it("FR-ACC-007 accepts a JPEG under 2 MB", () => {
    expect(avatarRejection({ size: 1_000_000, head: jpeg })).toBeNull();
  });

  it("FR-ACC-007 accepts a PNG under 2 MB", () => {
    expect(avatarRejection({ size: 1_000_000, head: png })).toBeNull();
  });

  it("FR-ACC-007 accepts a file of exactly the limit", () => {
    expect(avatarRejection({ size: maxAvatarBytes, head: png })).toBeNull();
  });

  it("FR-ACC-007 rejects a 10 MB file as too large", () => {
    expect(avatarRejection({ size: 10 * 1024 * 1024, head: jpeg })).toBe("tooLarge");
  });

  it("FR-ACC-007 rejects a PDF renamed to .png by its contents", () => {
    expect(avatarRejection({ size: 1000, head: pdf })).toBe("wrongType");
  });

  it("FR-ACC-007 rejects an empty file", () => {
    expect(avatarRejection({ size: 0, head: new Uint8Array() })).toBe("wrongType");
  });
});
