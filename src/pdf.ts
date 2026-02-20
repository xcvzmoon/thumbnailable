import { createCanvas, Path2D } from '@napi-rs/canvas';
import { getResolvedPDFJS } from 'unpdf';
import { handleInput, bufferToArrayBuffer, ThumbnailError } from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
}

async function renderCenteredThumbnail(pdfData: Uint8Array) {
  const { getDocument } = await getResolvedPDFJS();
  const canvasFactory = new NodeCanvasFactory();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const pdf = await getDocument({
    data: pdfData,
    canvasFactory,
  } as unknown as { data: Uint8Array }).promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  const scaleX = TARGET_WIDTH / viewport.width;
  const scaleY = TARGET_HEIGHT / viewport.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = Math.round(viewport.width * scale);
  const scaledHeight = Math.round(viewport.height * scale);
  const offsetX = Math.round((TARGET_WIDTH - scaledWidth) / 2);
  const offsetY = Math.round((TARGET_HEIGHT - scaledHeight) / 2);

  const renderViewport = page.getViewport({ scale });
  const { canvas: pageCanvas, context: pageCtx } = canvasFactory.create(scaledWidth, scaledHeight);

  await page.render({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    canvasContext: pageCtx as never,
    viewport: renderViewport,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    canvas: pageCanvas as never,
  } as never).promise;

  const outputCanvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  const outputCtx = outputCanvas.getContext('2d');

  outputCtx.fillStyle = '#FFFFFF';
  outputCtx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  outputCtx.drawImage(pageCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

  const webpBuffer = await outputCanvas.encode('webp');
  return Buffer.from(webpBuffer);
}

// Polyfill Path2D for PDF.js in Node.js environment
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access
(globalThis as any).Path2D = Path2D;

/**
 * Generates a thumbnail from a PDF document (first page only).
 *
 * @param source - File path, URL, or Buffer of the PDF file
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getPdfThumbnail('./document.pdf');
 *
 * // From URL
 * const thumbnail = await getPdfThumbnail('https://example.com/document.pdf');
 *
 * // From Buffer
 * const buffer = await readFile('./document.pdf');
 * const thumbnail = await getPdfThumbnail(buffer);
 * ```
 */
export async function getPdfThumbnail(source: string | Buffer) {
  try {
    const buffer = await handleInput(source);
    const thumbnailBuffer = await renderCenteredThumbnail(new Uint8Array(buffer));
    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate PDF thumbnail: ${String(error)}`,
      String(source),
      'PROCESSING_ERROR',
    );
  }
}
