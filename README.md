# Thumbnailable

<p align="center">
  <a href="https://www.npmjs.com/package/thumbnailable">
    <img src="https://img.shields.io/npm/v/thumbnailable.svg" alt="npm version" />
  </a>
  <a href="https://github.com/xcvzmoon/thumbnailable/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/xcvzmoon/thumbnailable/ci.yaml?label=ci" alt="CI Status" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-18+-green.svg" alt="Node.js Version" />
  </a>
</p>

> Generate thumbnail images from documents and images in Node.js

Thumbnailable is a TypeScript library that generates thumbnail images from various document formats. Perfect for creating preview images for file uploads, document management systems, or content management platforms.

## Features

- **Zero runtime dependencies** - Uses native Node.js capabilities where possible
- **Multiple input sources** - Support for file paths, URLs, and Buffers
- **Rich error handling** - Custom `ThumbnailError` with error codes for programmatic handling
- **TypeScript native** - Full TypeScript support with type definitions
- **Consistent output** - All thumbnails are 640x360 WebP images

## Supported Formats

| Format     | Function            | Notes                              |
| ---------- | ------------------- | ---------------------------------- |
| Images     | `getImageThumbnail` | JPEG, PNG, WebP, GIF, AVIF, TIFF   |
| PDF        | `getPdfThumbnail`   | First page only                    |
| Text       | `getTextThumbnail`  | TXT, CSV, MD, and other text files |
| Excel      | `getExcelThumbnail` | XLSX (first sheet)                 |
| Word       | `getWordThumbnail`  | DOC and DOCX                       |
| PowerPoint | `getPptxThumbnail`  | PPTX (first slide)                 |

## Installation

```bash
# Using bun (recommended)
bun add thumbnailable

# Using npm
npm install thumbnailable

# Using yarn
yarn add thumbnailable
```

## Quick Start

```typescript
import { writeFile } from 'node:fs/promises';
import { getPdfThumbnail, ThumbnailError } from 'thumbnailable';

try {
  // Generate thumbnail from PDF
  const thumbnail = await getPdfThumbnail('./document.pdf');

  // Save to file
  await writeFile('./thumbnail.webp', Buffer.from(thumbnail));

  console.log('Thumbnail generated successfully!');
} catch (error) {
  if (error instanceof ThumbnailError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    console.error(`Source: ${error.source}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Usage Examples

### From File Path

```typescript
import { getPdfThumbnail } from 'thumbnailable';

const thumbnail = await getPdfThumbnail('./my-document.pdf');
```

### From URL

```typescript
import { getPdfThumbnail } from 'thumbnailable';

const thumbnail = await getPdfThumbnail('https://example.com/document.pdf');
```

### From Buffer

```typescript
import { readFile } from 'node:fs/promises';
import { getPdfThumbnail } from 'thumbnailable';

const buffer = await readFile('./document.pdf');
const thumbnail = await getPdfThumbnail(buffer);
```

### Using with Fetch API

```typescript
import { getPdfThumbnail } from 'thumbnailable';

const response = await fetch('https://example.com/file.pdf');
const buffer = await response.arrayBuffer();
const thumbnail = await getPdfThumbnail(buffer);
```

### Error Handling

```typescript
import { getPdfThumbnail, ThumbnailError } from 'thumbnailable';

try {
  const thumbnail = await getPdfThumbnail('./document.pdf');
} catch (error) {
  if (error instanceof ThumbnailError) {
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        console.error('The file does not exist:', error.source);
        break;
      case 'TIMEOUT':
        console.error('Download timed out:', error.source);
        break;
      case 'PROCESSING_ERROR':
        console.error('Failed to process the file:', error.message);
        break;
      default:
        console.error(`Error [${error.code}]:`, error.message);
    }
  }
  throw error;
}
```

## API Reference

### `getImageThumbnail(source)`

Generates a thumbnail from an image file. Uses Sharp for high-quality image processing.

**Parameters:**

- `source` - `string | ArrayBuffer` - File path or ArrayBuffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Example:**

```typescript
const thumbnail = await getImageThumbnail('./photo.jpg');
```

---

### `getPdfThumbnail(source)`

Generates a thumbnail from the first page of a PDF document.

**Parameters:**

- `source` - `string | Buffer` - File path, URL, or Buffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Output:**

- Dimensions: 640x360 pixels
- Rendering: PDF page centered on white background

**Example:**

```typescript
const thumbnail = await getPdfThumbnail('./document.pdf');
```

---

### `getTextThumbnail(source)`

Generates a thumbnail from a text file with syntax-aware rendering.

**Parameters:**

- `source` - `string | Buffer` - File path, URL, or Buffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Output:**

- Dimensions: 640x360 pixels
- Font: Monospace (Consolas/Monaco)
- Max: 50 lines or 2000 characters
- CSV files: Renders with column separators

**Example:**

```typescript
const thumbnail = await getTextThumbnail('./readme.md');
```

---

### `getExcelThumbnail(source)`

Generates a thumbnail from the first sheet of an Excel workbook.

**Parameters:**

- `source` - `string | Buffer` - File path or Buffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Output:**

- Dimensions: 640x360 pixels
- Renders: Up to 20 rows and 6 columns
- Features: Gridlines, header row highlighting

**Example:**

```typescript
const thumbnail = await getExcelThumbnail('./data.xlsx');
```

---

### `getWordThumbnail(source)`

Generates a thumbnail from a Word document.

**Parameters:**

- `source` - `string | Buffer` - File path or Buffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Output:**

- Dimensions: 640x360 pixels
- Font: Times New Roman (serif)
- Max: 20 lines or 1500 characters

**Example:**

```typescript
const thumbnail = await getWordThumbnail('./document.docx');
```

---

### `getPptxThumbnail(source)`

Generates a thumbnail from the first slide of a PowerPoint presentation.

**Parameters:**

- `source` - `string | Buffer` - File path or Buffer

**Returns:** `Promise<ArrayBuffer>` - WebP thumbnail

**Output:**

- Dimensions: 640x360 pixels
- Font: Arial (sans-serif)
- Max: 15 lines or 1200 characters

**Example:**

```typescript
const thumbnail = await getPptxThumbnail('./presentation.pptx');
```

## Error Handling

All functions throw `ThumbnailError` on failure, which includes:

```typescript
class ThumbnailError extends Error {
  readonly source: string; // File path or URL that caused the error
  readonly code: string; // Error code for programmatic handling
}
```

### Error Codes

| Code               | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `FILE_NOT_FOUND`   | The specified file does not exist or is not readable |
| `EMPTY_BUFFER`     | An empty Buffer or ArrayBuffer was provided          |
| `INVALID_FORMAT`   | The file format is invalid or unsupported            |
| `DOWNLOAD_FAILED`  | Failed to download from URL (HTTP error)             |
| `TIMEOUT`          | Request timed out (default: 30 seconds)              |
| `PROCESSING_ERROR` | Error during thumbnail generation                    |

### Handling Errors

```typescript
import { getPdfThumbnail, ThumbnailError } from 'thumbnailable';

try {
  const thumbnail = await getPdfThumbnail(source);
} catch (error) {
  if (error instanceof ThumbnailError) {
    // Handle specific error codes
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        // File doesn't exist
        break;
      case 'TIMEOUT':
        // Request timed out
        break;
      case 'PROCESSING_ERROR':
        // Invalid file format or processing failed
        break;
    }
  }
  throw error; // Re-throw if not handled
}
```

## TypeScript

This library is written in TypeScript and includes type definitions. No additional `@types` packages are needed.

```typescript
import {
  getPdfThumbnail,
  getExcelThumbnail,
  getWordThumbnail,
  getPptxThumbnail,
  getTextThumbnail,
  getImageThumbnail,
  ThumbnailError,
} from 'thumbnailable';
```

## Requirements

- Node.js 18+
- Bun 1.3+ (for development)

## Building

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Lint code
bun run lint

# Format code
bun run format

# Build for production
bun run build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Created by [xcvzmoon](https://github.com/xcvzmoon).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
