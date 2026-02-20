import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, describe } from 'vitest';
import { getPdfThumbnail } from '../src/pdf';

const TEST_PDF_PATH = join(__dirname, '../test-pdf.pdf');

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
  });

  describe('when input is a Buffer', () => {
    test('returns a valid thumbnail ArrayBuffer', async () => {
      const buffer = await readFile(TEST_PDF_PATH);
      const result = await getPdfThumbnail(buffer);
      expectValidThumbnail(result);
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
