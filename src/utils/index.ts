import type { Canvas } from '@napi-rs/canvas';
import { constants } from 'node:fs';
import { readFile, access } from 'node:fs/promises';

const DEFAULT_TIMEOUT = 30000;

export class ThumbnailError extends Error {
  readonly source: string;
  readonly code: string;

  constructor(message: string, source: string, code: string) {
    super(message);
    this.name = 'ThumbnailError';
    this.source = source;
    this.code = code;
  }
}

export function isUrl(source: string) {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

export async function downloadFromUrl(url: string, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new ThumbnailError(
        `Failed to download: ${response.status} ${response.statusText}`,
        url,
        'DOWNLOAD_FAILED',
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ThumbnailError(`Download timed out after ${timeout}ms`, url, 'TIMEOUT');
    }
    throw new ThumbnailError(`Download failed: ${String(error)}`, url, 'DOWNLOAD_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function validateFilePath(filePath: string) {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw new ThumbnailError(
      `File not found or not readable: ${filePath}`,
      filePath,
      'FILE_NOT_FOUND',
    );
  }
}

export async function handleInput(source: string | Buffer) {
  if (Buffer.isBuffer(source)) {
    if (source.length === 0) {
      throw new ThumbnailError('Empty buffer provided', '<buffer>', 'EMPTY_BUFFER');
    }
    return source;
  }

  if (isUrl(source)) {
    return downloadFromUrl(source);
  }

  await validateFilePath(source);
  return readFile(source);
}

export async function renderToBuffer(canvas: Canvas) {
  const webpBuffer = await canvas.encode('webp');
  return Buffer.from(webpBuffer);
}

export function bufferToArrayBuffer(buffer: Buffer) {
  const result = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  if (result instanceof SharedArrayBuffer) {
    throw new ThumbnailError('Unexpected SharedArrayBuffer', '<buffer>', 'BUFFER_ERROR');
  }

  return result;
}
