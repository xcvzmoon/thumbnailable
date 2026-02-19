import { existsSync } from 'node:fs';
import { readFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getPdfThumbnail } from '../src/pdf';

const TEST_PDF_PATH = join(__dirname, '../test-pdf.pdf');

async function expectValidOutputFile(outputPath: string) {
  expect(existsSync(outputPath)).toBe(true);
  const stats = await stat(outputPath);
  expect(stats.size).toBeGreaterThan(0);
}

function expectValidThumbnail(result: ArrayBuffer) {
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(result.byteLength).toBeGreaterThan(0);
}

describe('getPdfThumbnail', () => {
  describe('when input is a file path string', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const result = await getPdfThumbnail(TEST_PDF_PATH);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const outputPath = '/tmp/test-pdf-thumbnail-output.webp';
      const result = await getPdfThumbnail(TEST_PDF_PATH, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PDF_PATH);
      const result = await getPdfThumbnail(buffer);
      expectValidThumbnail(result);
    });

    test('writes thumbnail to output path and returns ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PDF_PATH);
      const outputPath = '/tmp/test-pdf-thumbnail-buffer-out.webp';
      const result = await getPdfThumbnail(buffer, outputPath);
      await expectValidOutputFile(outputPath);
      expectValidThumbnail(result);
      await unlink(outputPath);
    });
  });

  describe('when input is a URL', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      const result = await getPdfThumbnail(url);
      expectValidThumbnail(result);
    }, 30000);
  });
});
