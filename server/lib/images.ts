import sharp from "sharp";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Only raster decoders are allowed; discard metadata and emit one inert WebP frame. */
export async function safeImage(
  buffer: Buffer,
  favicon = false,
): Promise<Buffer> {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES)
    throw new Error("Image too large or empty");
  // ICO stores PNG/BMP entries. Accept PNG-backed ICOs; reject legacy DIB entries safely.
  if (
    favicon &&
    buffer.length >= 22 &&
    buffer.readUInt16LE(0) === 0 &&
    buffer.readUInt16LE(2) === 1
  ) {
    const size = buffer.readUInt32LE(14);
    const offset = buffer.readUInt32LE(18);
    if (offset < 22 || size > buffer.length - offset)
      throw new Error("Invalid ICO");
    buffer = buffer.subarray(offset, offset + size);
  }
  const head = buffer.subarray(0, 16);
  const raster =
    head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    head
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    /^GIF8[79]a/.test(head.toString()) ||
    (head.subarray(0, 4).toString() === "RIFF" &&
      head.subarray(8, 12).toString() === "WEBP");
  if (!raster) throw new Error("Unsupported raster image signature");
  const image = sharp(buffer, {
    limitInputPixels: 40_000_000,
    animated: false,
    failOn: "error",
  });
  const metadata = await image.metadata();
  if (
    !metadata.format ||
    !["jpeg", "png", "gif", "webp", "avif", "tiff"].includes(metadata.format)
  ) {
    throw new Error(
      "Only raster images are supported; SVG and HTML are disabled",
    );
  }
  return image
    .rotate()
    .resize({
      width: favicon ? 256 : 4096,
      height: favicon ? 256 : 4096,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}
