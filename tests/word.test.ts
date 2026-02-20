import { existsSync } from 'node:fs';
import { readFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getWordThumbnail } from '../src/word';

const TEST_WORD_PATH = join(__dirname, '../test-docx.docx');

async function expectValidOutputFile(outputPath: string) {
  expect(existsSync(outputPath)).toBe(true);
  const stats = await stat(outputPath);
  expect(stats.size).toBeGreaterThan(0);
}

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getWordThumbnail', () => {
  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getWordThumbnail(TEST_WORD_PATH);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const outputPath = '/tmp/test-word-thumbnail-output.webp';
      const result = await getWordThumbnail(TEST_WORD_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_WORD_PATH);
      const result = await getWordThumbnail(buffer);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const buffer = await readFile(TEST_WORD_PATH);
      const outputPath = '/tmp/test-word-thumbnail-buffer-out.webp';
      const result = await getWordThumbnail(buffer, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });
});
