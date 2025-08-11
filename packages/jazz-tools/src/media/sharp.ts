import { Account, FileStream, Group } from "jazz-tools";
import sharp from "sharp";
import { createImageFactory } from "./create-image.js";

export type SharpImageType =
  | File
  | Blob
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array;

export const createImageSharp = createImageFactory<SharpImageType, Blob>({
  createFileStreamFromSource,
  getImageSize,
  getPlaceholderBase64,
  resize,
});

function formatToMimeType(format: keyof sharp.FormatEnum | undefined) {
  const formatToTypeMap: Record<
    Extract<
      keyof sharp.FormatEnum,
      "avif" | "gif" | "jpeg" | "jpg" | "png" | "webp"
    >,
    string
  > = {
    avif: "image/avif",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  if (!format) {
    throw new Error("Could not determine image format");
  }

  if (!(format in formatToTypeMap)) {
    throw new Error(`Unsupported image format: ${format}`);
  }

  return formatToTypeMap[format as keyof typeof formatToTypeMap];
}

async function createFileStreamFromSource(
  imageBlobOrBuffer: SharpImageType,
  owner?: Account | Group,
): Promise<FileStream> {
  // `File` is also an instance of `Blob`
  if (imageBlobOrBuffer instanceof Blob) {
    return FileStream.createFromBlob(imageBlobOrBuffer, { owner });
  }

  const image = sharp(imageBlobOrBuffer);
  const metadata = await image.metadata();
  const format = metadata.format;
  const mimeType = formatToMimeType(format);

  return FileStream.createFromArrayBuffer(
    imageBlobOrBuffer,
    mimeType,
    undefined,
    { owner },
  );
}

async function getImageSize(
  imageBlobOrBuffer: SharpImageType,
): Promise<{ width: number; height: number }> {
  const imageBuffer =
    imageBlobOrBuffer instanceof Blob
      ? await imageBlobOrBuffer.arrayBuffer()
      : imageBlobOrBuffer;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  return { width: metadata.width!, height: metadata.height! };
}

async function getPlaceholderBase64(
  imageBlobOrBuffer: SharpImageType,
): Promise<string> {
  const imageBuffer =
    imageBlobOrBuffer instanceof Blob
      ? await imageBlobOrBuffer.arrayBuffer()
      : imageBlobOrBuffer;

  const image = sharp(imageBuffer);
  const placeholder = await image
    .resize({
      width: 8,
      height: 8,
      fit: "inside",
    })
    .toFormat("png")
    .toBuffer();

  return `data:image/png;base64,${placeholder.toString("base64")}`;
}

async function resize(
  imageBlobOrBuffer: SharpImageType,
  width: number,
  height: number,
): Promise<Blob> {
  const imageBuffer =
    imageBlobOrBuffer instanceof Blob
      ? await imageBlobOrBuffer.arrayBuffer()
      : imageBlobOrBuffer;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const format = metadata.format;
  const mimeType = formatToMimeType(format);

  const resizedBuffer = await image
    .resize({
      width,
      height,
    })
    .toBuffer();

  return new Blob([new Uint8Array(resizedBuffer)], {
    type: mimeType,
  });
}
