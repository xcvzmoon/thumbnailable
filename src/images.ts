import sharp from 'sharp';
import {
  isUrl,
  downloadFromUrl,
  bufferToArrayBuffer,
  ThumbnailError,
  validateFilePath,
} from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;

async function handleImageInput(source: string | ArrayBuffer) {
  if (Buffer.isBuffer(source)) {
    if (source.length === 0) {
      throw new ThumbnailError('Empty buffer provided', '<buffer>', 'EMPTY_BUFFER');
    }
    return source;
  }
  if (source instanceof ArrayBuffer) {
    if (source.byteLength === 0) {
      throw new ThumbnailError('Empty ArrayBuffer provided', '<arraybuffer>', 'EMPTY_BUFFER');
    }
    return Buffer.from(source);
  }
  if (isUrl(source)) {
    return downloadFromUrl(source);
  }
  await validateFilePath(source);
  const { readFile } = await import('node:fs/promises');
  return readFile(source);
}

/**
 * Generates a thumbnail from an image file.
 *
 * @param source - File path, URL, or ArrayBuffer of the image
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getImageThumbnail('./photo.jpg');
 *
 * // From URL
 * const thumbnail = await getImageThumbnail('https://example.com/photo.jpg');
 *
 * // From ArrayBuffer
 * const buffer = await fetch(url).then(r => r.arrayBuffer());
 * const thumbnail = await getImageThumbnail(buffer);
 * ```
 */
export async function getImageThumbnail(source: string | ArrayBuffer) {
  const sourceStr = typeof source === 'string' ? source : '<buffer>';

  try {
    const buffer = await handleImageInput(source);

    const thumbnailBuffer = await sharp(buffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate image thumbnail: ${String(error)}`,
      sourceStr,
      'PROCESSING_ERROR',
    );
  }
}
