import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import PptxParser from 'node-pptx-parser';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const PADDING = 16;
const MAX_LINES = 15;
const MAX_CHARS = 1200;

function isURL(source: string): boolean {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

async function downloadPptx(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download PowerPoint: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

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

  const webpBuffer = await canvas.encode('webp');
  return Buffer.from(webpBuffer);
}

export async function getPptxThumbnail(source: string | Buffer, output?: string) {
  let filePath: string;
  let outputPath: string;
  let tmpOutputFile: string | undefined;
  let tmpInputFile: string | undefined;

  try {
    if (Buffer.isBuffer(source)) {
      tmpInputFile = join(tmpdir(), `pptx-src-${randomUUID()}.pptx`);
      await writeFile(tmpInputFile, source);
      filePath = tmpInputFile;
    } else if (isURL(source)) {
      const buffer = await downloadPptx(source);
      tmpInputFile = join(tmpdir(), `pptx-src-${randomUUID()}.pptx`);
      await writeFile(tmpInputFile, buffer);
      filePath = tmpInputFile;
    } else {
      filePath = source;
    }

    const parser = new PptxParser(filePath);
    const textContent = await parser.extractText();

    const firstSlide = textContent[0];
    const content = firstSlide?.text?.join('\n') ?? '';

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `pptx-thumbnail-${randomUUID()}.webp`);
      outputPath = tmpOutputFile;
    }

    const thumbnailBuffer = await renderPptxThumbnail(content);
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
    console.error('An error occurred while trying to generate PowerPoint thumbnail', error);
    throw error;
  } finally {
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
    if (tmpInputFile) await unlink(tmpInputFile).catch(() => {});
  }
}
