import type { SKRSContext2D } from '@napi-rs/canvas';
import { readFile } from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import {
  isUrl,
  downloadFromUrl,
  renderToBuffer,
  bufferToArrayBuffer,
  ThumbnailError,
} from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 14;
const LINE_HEIGHT = 18;
const PADDING = 16;
const MAX_CHARS = 2000;
const MAX_LINES = 50;

function formatCsvLine(line: string) {
  return line.replace(/,/g, ' │ ');
}

function wrapText(text: string, maxWidth: number, context: SKRSContext2D) {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

async function getTextContent(source: string | Buffer, mimeType?: string) {
  if (Buffer.isBuffer(source)) {
    return { content: source.toString('utf-8'), mimeType };
  }

  if (isUrl(source)) {
    const response = await downloadFromUrl(source);
    return { content: response.toString('utf-8'), mimeType };
  }

  let fileMimeType: string | undefined;
  if (source.endsWith('.csv')) fileMimeType = 'text/csv';
  else if (source.endsWith('.md')) fileMimeType = 'text/markdown';
  else fileMimeType = 'text/plain';

  const content = await readFile(source, 'utf-8');
  return { content, mimeType: fileMimeType };
}

async function renderTextThumbnail(content: string, mimeType?: string) {
  const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  const context = canvas.getContext('2d');

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  context.fillStyle = '#2d3748';
  context.font = `${FONT_SIZE}px monospace`;
  context.textBaseline = 'alphabetic';

  let lines = content.split('\n').slice(0, MAX_LINES);
  let isCsv = mimeType?.includes('csv') || (content.includes(',') && lines[0]?.includes(','));

  const truncatedContent = truncateText(content, MAX_CHARS);
  lines = truncatedContent.split('\n').slice(0, MAX_LINES);

  const maxTextWidth = TARGET_WIDTH - PADDING * 2;
  const startY = PADDING + FONT_SIZE;

  let y = startY;
  for (let i = 0; i < lines.length && y < TARGET_HEIGHT - PADDING; i++) {
    let line = lines[i];
    if (!line) continue;
    if (isCsv && i < 20) line = formatCsvLine(line);

    const wrappedLines = wrapText(line, maxTextWidth, context);

    for (const wrappedLine of wrappedLines) {
      if (y >= TARGET_HEIGHT - PADDING) break;
      context.fillText(wrappedLine, PADDING, y);
      y += LINE_HEIGHT;
    }
  }

  if (content.length > MAX_CHARS || lines.length >= MAX_LINES) {
    context.fillStyle = '#718096';
    context.fillText('...', PADDING, Math.min(y, TARGET_HEIGHT - PADDING));
  }

  return renderToBuffer(canvas);
}

/**
 * Generates a thumbnail from a text file (TXT, CSV, MD, etc.).
 *
 * @param source - File path, URL, or Buffer of the text file
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getTextThumbnail('./document.txt');
 *
 * // From URL
 * const thumbnail = await getTextThumbnail('https://example.com/document.txt');
 *
 * // From Buffer
 * const buffer = await readFile('./document.txt');
 * const thumbnail = await getTextThumbnail(buffer);
 * ```
 */
export async function getTextThumbnail(source: string | Buffer) {
  try {
    const { content, mimeType } = await getTextContent(source);
    const thumbnailBuffer = await renderTextThumbnail(content, mimeType);
    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate text thumbnail: ${String(error)}`,
      String(source),
      'PROCESSING_ERROR',
    );
  }
}
