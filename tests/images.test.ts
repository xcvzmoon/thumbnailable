import { existsSync } from 'fs';
import { readFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { expect, test, describe } from 'vitest';
import { getImageThumbnail } from '../src/images';

const TEST_IMAGE_PATH = join(__dirname, '../test-image.jpeg');

async function loadImageAsArrayBuffer(path: string) {
  const buffer = await readFile(path);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function expectValidOutputFile(outputPath: string) {
  expect(existsSync(outputPath)).toBe(true);
  const stats = await stat(outputPath);
  expect(stats.size).toBeGreaterThan(0);
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

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const outputPath = '/tmp/test-thumbnail-output.jpg';
      const result = await getImageThumbnail(TEST_IMAGE_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is an ArrayBuffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const arrayBuffer = await loadImageAsArrayBuffer(TEST_IMAGE_PATH);
      const result = await getImageThumbnail(arrayBuffer);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const arrayBuffer = await loadImageAsArrayBuffer(TEST_IMAGE_PATH);
      const outputPath = '/tmp/test-thumbnail-arraybuffer-out.jpg';
      const result = await getImageThumbnail(arrayBuffer, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });
});
