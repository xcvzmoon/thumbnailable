import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getPptxThumbnail } from '../src/pptx';

const TEST_PPTX_PATH = join(__dirname, '../test-pptx.pptx');

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getPptxThumbnail', () => {
  const testFileExists = existsSync(TEST_PPTX_PATH);

  test.skipIf(!testFileExists)('test file exists', () => {
    expect(true).toBe(true);
  });

  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getPptxThumbnail(TEST_PPTX_PATH);
      expectValidThumbnail(result);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PPTX_PATH);
      const result = await getPptxThumbnail(buffer);
      expectValidThumbnail(result);
    });
  });
});
