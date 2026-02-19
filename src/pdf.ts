import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';
import { randomUUID } from 'node:crypto';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { getResolvedPDFJS } from 'unpdf';

// Polyfill Path2D for PDF.js in Node.js environment
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access
(globalThis as any).Path2D = Path2D;

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;

interface CanvasAndContext {
  canvas: Canvas;
  context: SKRSContext2D;
}

function isUrl(source: string): boolean {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

async function downloadPdf(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

class NodeCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
}

async function renderCenteredThumbnail(pdfData: Uint8Array): Promise<Buffer> {
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

export async function getPdfThumbnail(source: string | Buffer, output?: string) {
  let pdfBuffer: Buffer;
  let outputPath: string;
  let tmpOutputFile: string | undefined;

  try {
    if (Buffer.isBuffer(source)) pdfBuffer = source;
    else if (isUrl(source)) pdfBuffer = await downloadPdf(source);
    else pdfBuffer = await readFile(source);

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `pdf-thumbnail-${randomUUID()}.webp`);
      outputPath = tmpOutputFile;
    }

    const thumbnailBuffer = await renderCenteredThumbnail(new Uint8Array(pdfBuffer));
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
    console.error('An error occurred while trying to generate PDF thumbnail', error);
    throw error;
  } finally {
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
  }
}
