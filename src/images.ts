import { randomUUID } from 'node:crypto';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exiftool } from 'exiftool-vendored';

export async function getImageThumbnail(image: string | ArrayBuffer, output?: string) {
  let sourcePath: string;
  let outputPath: string;
  let tmpSourceFile: string | undefined;
  let tmpOutputFile: string | undefined;

  try {
    if (typeof image === 'string') {
      sourcePath = image;
    } else {
      tmpSourceFile = join(tmpdir(), `thumbnail-src-${randomUUID()}.jpg`);
      await writeFile(tmpSourceFile, Buffer.from(image));
      sourcePath = tmpSourceFile;
    }

    if (output) {
      outputPath = output;
    } else {
      tmpOutputFile = join(tmpdir(), `thumbnail-out-${randomUUID()}.jpg`);
      outputPath = tmpOutputFile;
    }

    await exiftool.extractThumbnail(sourcePath, outputPath);
    const buffer = await readFile(outputPath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (error) {
    console.error('An error occurred while trying to generate image thumbnail', error);
    throw error;
  } finally {
    if (tmpSourceFile) await unlink(tmpSourceFile).catch(() => {});
    if (tmpOutputFile) await unlink(tmpOutputFile).catch(() => {});
  }
}
