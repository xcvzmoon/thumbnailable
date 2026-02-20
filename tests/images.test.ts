import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getImageThumbnail } from '../src/images';

const TEST_IMAGE_PATH = join(__dirname, '../test-image.jpeg');

async function loadImageAsArrayBuffer(path: string) {
  const buffer = await readFile(path);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getImageThumbnail', () => {
  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getImageThumbnail(TEST_IMAGE_PATH);
      expectValidThumbnail(result);
    });
  });

  describe('when input is an ArrayBuffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const arrayBuffer = await loadImageAsArrayBuffer(TEST_IMAGE_PATH);
      const result = await getImageThumbnail(arrayBuffer);
      expectValidThumbnail(result);
    });
  });
});
