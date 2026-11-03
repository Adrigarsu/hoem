import "server-only";
import sharp from "sharp";
import { UnreadableImageError, type AvatarEncoder } from "./service";

// Twice the largest size an avatar is drawn at, for high-density screens.
const size = 256;
// Refuses a small file that decodes to an enormous image before it uses up the server's memory.
const maxInputPixels = 50_000_000;

// A new image rather than a copy: sharp keeps no metadata unless told to, so a photo's location
// never reaches the bucket. rotate() first, because the turn of a phone photo is in that metadata.
export const encodeAvatar: AvatarEncoder = async (image) => {
  const decoder = sharp(image, { limitInputPixels: maxInputPixels });
  await decoder.metadata().catch(() => {
    throw new UnreadableImageError();
  });
  const encoded = await decoder
    .rotate()
    // The initials lie under the photo (Avatar), so a transparent image must not let them through.
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
  return new Uint8Array(encoded);
};
