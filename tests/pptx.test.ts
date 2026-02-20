import { existsSync } from 'node:fs';
import { readFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getPptxThumbnail } from '../src/pptx';

const TEST_PPTX_PATH = join(__dirname, '../test-pptx.pptx');

async function expectValidOutputFile(outputPath: string) {
  expect(existsSync(outputPath)).toBe(true);
  const stats = await stat(outputPath);
  expect(stats.size).toBeGreaterThan(0);
}

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

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const outputPath = '/tmp/test-pptx-thumbnail-output.webp';
      const result = await getPptxThumbnail(TEST_PPTX_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PPTX_PATH);
      const result = await getPptxThumbnail(buffer);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PPTX_PATH);
      const outputPath = '/tmp/test-pptx-thumbnail-buffer-out.webp';
      const result = await getPptxThumbnail(buffer, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });
});
