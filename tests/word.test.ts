import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getWordThumbnail } from '../src/word';

const TEST_WORD_PATH = join(__dirname, '../test-docx.docx');

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
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_WORD_PATH);
      const result = await getWordThumbnail(buffer);
      expectValidThumbnail(result);
    });
  });
});
