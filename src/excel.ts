import { createCanvas } from '@napi-rs/canvas';
import * as XLSX from 'xlsx';
import { handleInput, renderToBuffer, bufferToArrayBuffer, ThumbnailError } from './utils';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
const PADDING = 12;
const CELL_PADDING = 8;
const COL_WIDTH = 100;
const MAX_ROWS = 20;
const MAX_COLS = 6;

function escapeCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return JSON.stringify(value);
}

function truncateCell(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.substring(0, maxLen - 3) + '...';
}

async function renderExcelThumbnail(buffer: Buffer) {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new ThumbnailError('Invalid Excel file format', '<buffer>', 'INVALID_FORMAT');
  }

  const sheetName = workbook.SheetNames[0] ?? 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new ThumbnailError('No worksheet found in workbook', '<buffer>', 'NO_WORKSHEET');
  }

  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  const context = canvas.getContext('2d');

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  context.fillStyle = '#2D3748';
  context.font = `${FONT_SIZE}px sans-serif`;

  let rowY = PADDING + FONT_SIZE;

  for (let rowIndex = 0; rowIndex < json.length && rowIndex < MAX_ROWS; rowIndex++) {
    const row = json[rowIndex];
    if (!row || !Array.isArray(row)) continue;

    const isHeader = rowIndex === 0;
    if (isHeader) {
      context.fillStyle = '#EDF2F7';
      context.fillRect(0, rowY - FONT_SIZE / 2, TARGET_WIDTH, LINE_HEIGHT);
      context.fillStyle = '#1A202C';
      context.font = 'bold 11px sans-serif';
    } else {
      context.fillStyle = '#2D3748';
      context.font = `${FONT_SIZE}px sans-serif`;
    }

    let colX = CELL_PADDING;
    for (let columnIndex = 0; columnIndex < row.length && columnIndex < MAX_COLS; columnIndex++) {
      const cellValue = truncateCell(escapeCellValue(row[columnIndex]), 20);

      context.fillText(cellValue, colX, rowY);
      context.strokeStyle = '#E2E8F0';
      context.lineWidth = 1;
      context.strokeRect(colX - CELL_PADDING / 2, rowY - FONT_SIZE / 2, COL_WIDTH, LINE_HEIGHT);
      colX += COL_WIDTH;
    }

    rowY += LINE_HEIGHT;

    if (rowY > TARGET_HEIGHT - CELL_PADDING) break;
  }

  if (json.length > MAX_ROWS) {
    context.fillStyle = '#718096';
    context.font = 'italic 11px sans-serif';
    context.fillText(
      `... ${json.length - MAX_ROWS} more rows`,
      CELL_PADDING,
      TARGET_HEIGHT - CELL_PADDING,
    );
  }

  return renderToBuffer(canvas);
}

/**
 * Generates a thumbnail from an Excel spreadsheet (first sheet only).
 *
 * @param source - File path, URL, or Buffer of the Excel file
 * @returns Promise<ArrayBuffer> - Thumbnail as WebP ArrayBuffer
 *
 * @example
 * ```ts
 * // From file path
 * const thumbnail = await getExcelThumbnail('./data.xlsx');
 *
 * // From URL
 * const thumbnail = await getExcelThumbnail('https://example.com/data.xlsx');
 *
 * // From Buffer
 * const buffer = await readFile('./data.xlsx');
 * const thumbnail = await getExcelThumbnail(buffer);
 * ```
 */
export async function getExcelThumbnail(source: string | Buffer) {
  try {
    const buffer = await handleInput(source);
    const thumbnailBuffer = await renderExcelThumbnail(buffer);
    return bufferToArrayBuffer(thumbnailBuffer);
  } catch (error) {
    if (error instanceof ThumbnailError) throw error;
    throw new ThumbnailError(
      `Failed to generate Excel thumbnail: ${String(error)}`,
      String(source),
      'PROCESSING_ERROR',
    );
  }
}
