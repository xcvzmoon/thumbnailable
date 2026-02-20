import { createCanvas } from '@napi-rs/canvas';
import WordExtractor from 'word-extractor';
import { handleInput, renderToBuffer, bufferToArrayBuffer, ThumbnailError } from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
const PADDING = 12;
const MAX_LINES = 20;
const MAX_CHARS = 1500;

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

  return renderToBuffer(canvas);
}

/**
 * Generates a thumbnail from a Word document (DOC or DOCX).
 *
 * @param source - File path, URL, or Buffer of the Word document
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getWordThumbnail('./document.docx');
 *
 * // From URL
 * const thumbnail = await getWordThumbnail('https://example.com/document.docx');
 *
 * // From Buffer
 * const buffer = await readFile('./document.docx');
 * const thumbnail = await getWordThumbnail(buffer);
 * ```
 */
export async function getWordThumbnail(source: string | Buffer) {
  try {
    const buffer = await handleInput(source);

    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    const content = doc.getBody();

    const thumbnailBuffer = await renderWordThumbnail(content);
    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate Word thumbnail: ${String(error)}`,
      String(source),
      'PROCESSING_ERROR',
    );
  }
}
