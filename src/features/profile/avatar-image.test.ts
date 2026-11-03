import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { encodeAvatar } from "./avatar-image";
import { UnreadableImageError } from "./service";

// A photo as a phone takes it: landscape, turned by its metadata, with EXIF that could hold a
// location.
async function phonePhoto() {
  return sharp({
    create: { width: 800, height: 400, channels: 3, background: { r: 51, g: 102, b: 153 } },
  })
    .withExif({ IFD3: { GPSLatitude: "40/1 25/1 0/1", GPSLongitude: "3/1 42/1 0/1" } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
}

describe("encodeAvatar", () => {
  it("FR-ACC-007 stores a small square WebP", async () => {
    const encoded = await encodeAvatar(new Uint8Array(await phonePhoto()));
    const metadata = await sharp(encoded).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 256, height: 256 });
  });

  it("FR-ACC-007 removes the metadata, so a photo's location never reaches the bucket", async () => {
    const photo = await phonePhoto();
    expect((await sharp(photo).metadata()).exif).toBeDefined();
    const encoded = await encodeAvatar(new Uint8Array(photo));
    expect((await sharp(encoded).metadata()).exif).toBeUndefined();
  });

  it("FR-ACC-007 fails on a file that only looks like an image", async () => {
    const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3);
    await expect(encodeAvatar(png)).rejects.toBeInstanceOf(UnreadableImageError);
  });

  it("FR-ACC-007 fills a transparent image, so the initials do not show through it", async () => {
    const transparent = await sharp({
      create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    const encoded = await encodeAvatar(new Uint8Array(transparent));
    expect((await sharp(encoded).metadata()).hasAlpha).toBe(false);
  });
});
