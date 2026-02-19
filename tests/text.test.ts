import { existsSync } from 'node:fs';
import { readFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getTextThumbnail } from '../src/text';

const TEST_TEXT_PATH = join(__dirname, '../test-text.txt');
const TEST_CSV_PATH = join(__dirname, '../test-csv.csv');

async function expectValidOutputFile(outputPath: string) {
  expect(existsSync(outputPath)).toBe(true);
  const stats = await stat(outputPath);
  expect(stats.size).toBeGreaterThan(0);
}

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getTextThumbnail', () => {
  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getTextThumbnail(TEST_TEXT_PATH);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const outputPath = '/tmp/test-text-thumbnail-output.webp';
      const result = await getTextThumbnail(TEST_TEXT_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_TEXT_PATH);
      const result = await getTextThumbnail(buffer);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const buffer = await readFile(TEST_TEXT_PATH);
      const outputPath = '/tmp/test-text-thumbnail-buffer-out.webp';
      const result = await getTextThumbnail(buffer, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a CSV file', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getTextThumbnail(TEST_CSV_PATH);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path', async () => {
      const outputPath = '/tmp/test-csv-thumbnail-output.webp';
      const result = await getTextThumbnail(TEST_CSV_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a URL', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const url = 'https://raw.githubusercontent.com/xcvzmoon/thumbnailable/main/README.md';
      const result = await getTextThumbnail(url);
      expectValidThumbnail(result);
    }, 30000);
  });
});
