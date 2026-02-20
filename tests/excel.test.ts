import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { ThumbnailError } from '../src';
import { getExcelThumbnail } from '../src/excel';

const TEST_EXCEL_PATH = join(__dirname, '../test-xlsx.xlsx');

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getExcelThumbnail', () => {
  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getExcelThumbnail(TEST_EXCEL_PATH);
      expectValidThumbnail(result);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_EXCEL_PATH);
      const result = await getExcelThumbnail(buffer);
      expectValidThumbnail(result);
    });
  });

  describe('error handling', () => {
    test('throws ThumbnailError for non-existent file', async () => {
      await expect(getExcelThumbnail('/non/existent/file.xlsx')).rejects.toThrow(ThumbnailError);
    });

    test('throws ThumbnailError for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(getExcelThumbnail(emptyBuffer)).rejects.toThrow(ThumbnailError);
    });
  });
});
