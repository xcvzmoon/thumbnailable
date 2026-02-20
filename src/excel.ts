import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import * as XLSX from 'xlsx';

const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;
const PADDING = 12;
const CELL_PADDING = 8;
const COL_WIDTH = 100;
const MAX_ROWS = 20;
const MAX_COLS = 6;

function isURL(source: string) {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
}

async function downloadExcel(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download Excel: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

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
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0] ?? 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) throw new Error('No worksheet found in workbook');

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

  const webpBuffer = await canvas.encode('webp');
  return Buffer.from(webpBuffer);
}

export async function getExcelThumbnail(source: string | Buffer, output?: string) {
  let excelBuffer: Buffer;
  let outputPath: string;
  let tmpOutputFile: string | undefined;

  try {
    if (Buffer.isBuffer(source)) excelBuffer = source;
    else if (isURL(source)) excelBuffer = await downloadExcel(source);
    else excelBuffer = await readFile(source);

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `excel-thumbnail-${randomUUID()}.webp`);
      outputPath = tmpOutputFile;
    }

    const thumbnailBuffer = await renderExcelThumbnail(excelBuffer);
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
    console.error('An error occurred while trying to generate Excel thumbnail', error);
    throw error;
  } finally {
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
  }
}
