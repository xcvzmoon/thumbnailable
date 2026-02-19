import type { SKRSContext2D } from '@napi-rs/canvas';
import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 14;
const LINE_HEIGHT = 18;
const PADDING = 16;
const MAX_CHARS = 2000;
const MAX_LINES = 50;

function isURL(source: string) {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

async function downloadText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download text: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

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
  const startY = 0 + PADDING + FONT_SIZE;

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

  const webpBuffer = await canvas.encode('webp');
  return Buffer.from(webpBuffer);
}

export async function getTextThumbnail(source: string | Buffer, output?: string) {
  let content: string;
  let outputPath: string;
  let tmpOutputFile: string | undefined;
  let mimeType: string | undefined;

  try {
    if (Buffer.isBuffer(source)) {
      content = source.toString('utf-8');
    } else if (isURL(source)) {
      content = await downloadText(source);
    } else {
      content = await readFile(source, 'utf-8');
      if (source.endsWith('.csv')) mimeType = 'text/csv';
      else if (source.endsWith('.md')) mimeType = 'text/markdown';
      else mimeType = 'text/plain';
    }

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `text-thumbnail-${randomUUID()}.webp`);
      outputPath = tmpOutputFile;
    }

    const thumbnailBuffer = await renderTextThumbnail(content, mimeType);
    await writeFile(outputPath, thumbnailBuffer);
    const resultBuffer = thumbnailBuffer.buffer.slice(
      thumbnailBuffer.byteOffset,
      thumbnailBuffer.byteOffset + thumbnailBuffer.byteLength,
    );

    if (resultBuffer instanceof SharedArrayBuffer) {
      throw new Error('Unexpected SharedArrayBuffer');
    }

    return resultBuffer;
  } catch (error) {
    console.error('An error occurred while trying to generate text thumbnail', error);
    throw error;
  } finally {
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
  }
}
