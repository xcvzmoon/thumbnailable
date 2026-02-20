import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import PptxParser from 'node-pptx-parser';
import { handleInput, renderToBuffer, bufferToArrayBuffer, ThumbnailError } from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const PADDING = 16;
const MAX_LINES = 15;
const MAX_CHARS = 1200;

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

async function renderPptxThumbnail(content: string) {
  const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  const context = canvas.getContext('2d');

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  context.fillStyle = '#2D3748';
  context.font = `${FONT_SIZE}px Arial, Helvetica, sans-serif`;
  context.textBaseline = 'alphabetic';

  const truncatedContent = truncateText(content, MAX_CHARS);
  const lines = truncatedContent.split('\n').slice(0, MAX_LINES);

  let y = PADDING + FONT_SIZE;

  for (const line of lines) {
    if (y > TARGET_HEIGHT - PADDING) break;
    if (!line) {
      y += LINE_HEIGHT / 2;
      continue;
    }
    context.fillText(line, PADDING, y);
    y += LINE_HEIGHT;
  }

  if (content.length > MAX_CHARS || lines.length >= MAX_LINES) {
    context.fillStyle = '#718096';
    context.font = `italic ${FONT_SIZE}px Arial, Helvetica, sans-serif`;
    context.fillText('...', PADDING, Math.min(y, TARGET_HEIGHT - PADDING));
  }

  return renderToBuffer(canvas);
}

/**
 * Generates a thumbnail from a PowerPoint presentation (first slide only).
 *
 * @param source - File path, URL, or Buffer of the PowerPoint file
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getPptxThumbnail('./presentation.pptx');
 *
 * // From URL
 * const thumbnail = await getPptxThumbnail('https://example.com/presentation.pptx');
 *
 * // From Buffer
 * const buffer = await readFile('./presentation.pptx');
 * const thumbnail = await getPptxThumbnail(buffer);
 * ```
 */
export async function getPptxThumbnail(source: string | Buffer) {
  let tmpInputFile: string | undefined;

  try {
    const buffer = await handleInput(source);

    tmpInputFile = join(tmpdir(), `pptx-src-${randomUUID()}.pptx`);
    await writeFile(tmpInputFile, buffer);

    const parser = new PptxParser(tmpInputFile);
    const textContent = await parser.extractText();

    const firstSlide = textContent[0];
    const content = firstSlide?.text?.join('\n') ?? '';

    const thumbnailBuffer = await renderPptxThumbnail(content);
    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate PowerPoint thumbnail: ${String(error)}`,
      String(source),
      'PROCESSING_ERROR',
    );
  } finally {
    if (tmpInputFile) await unlink(tmpInputFile).catch(() => {});
  }
}
