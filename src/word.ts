import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import WordExtractor from 'word-extractor';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
const PADDING = 12;
const MAX_LINES = 20;
const MAX_CHARS = 1500;

function isURL(source: string): boolean {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

async function downloadWord(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download Word document: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

async function renderWordThumbnail(content: string) {
  const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  const context = canvas.getContext('2d');

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  context.fillStyle = '#2D3748';
  context.font = `${FONT_SIZE}px 'Times New Roman', Times, serif`;
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
    context.font = `italic ${FONT_SIZE}px 'Times New Roman', Times, serif`;
    context.fillText('...', PADDING, Math.min(y, TARGET_HEIGHT - PADDING));
  }

  const webpBuffer = await canvas.encode('webp');
  return Buffer.from(webpBuffer);
}

export async function getWordThumbnail(source: string | Buffer, output?: string) {
  let content: string;
  let outputPath: string;
  let tmpOutputFile: string | undefined;

  try {
    let docxBuffer: Buffer;

    if (Buffer.isBuffer(source)) docxBuffer = source;
    else if (isURL(source)) docxBuffer = await downloadWord(source);
    else docxBuffer = await readFile(source);

    const extractor = new WordExtractor();
    const doc = await extractor.extract(docxBuffer);
    content = doc.getBody();

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `word-thumbnail-${randomUUID()}.webp`);
      outputPath = tmpOutputFile;
    }

    const thumbnailBuffer = await renderWordThumbnail(content);
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
    console.error('An error occurred while trying to generate Word thumbnail', error);
    throw error;
  } finally {
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
  }
}
