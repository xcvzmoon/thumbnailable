# Thumbnailable

> **⚠️ Development Status**: This project is currently in active development.

A TypeScript library for extracting thumbnails from various document formats.

## Currently Supported

- **Images** - Extract thumbnails from JPEG, PNG, and other image formats using EXIF data
- **PDFs** - Generate thumbnails from PDF documents (first page, 640x360 centered)
- **Text files** - Generate thumbnails from text files (TXT, CSV, MD, etc.)

## Planned Support

The following formats will be supported in future releases:

- **DOCX** - Microsoft Word documents
- **PPTX** - Microsoft PowerPoint presentations
- **Excel** - Microsoft Excel spreadsheets (XLSX, XLS)

## Installation

```bash
bun install thumbnailable
```

## Usage

### Image Thumbnails

```typescript
import { getImageThumbnail } from 'thumbnailable';

// From file path
const thumbnail = await getImageThumbnail('./image.jpg');

// From file path with output
const thumbnail = await getImageThumbnail('./image.jpg', './output.jpg');

// From ArrayBuffer
const arrayBuffer = await fetch(imageUrl).then((r) => r.arrayBuffer());
const thumbnail = await getImageThumbnail(arrayBuffer);
```

### PDF Thumbnails

```typescript
import { getPdfThumbnail } from 'thumbnailable';

// From file path
const thumbnail = await getPdfThumbnail('./document.pdf');

// From file path with output
const thumbnail = await getPdfThumbnail('./document.pdf', './output.webp');

// From URL
const thumbnail = await getPdfThumbnail('https://example.com/document.pdf');

// From Buffer
const buffer = await readFile('./document.pdf');
const thumbnail = await getPdfThumbnail(buffer);
```

### Text Thumbnails

```typescript
import { getTextThumbnail } from 'thumbnailable';

// From file path
const thumbnail = await getTextThumbnail('./document.txt');

// From file path with output
const thumbnail = await getTextThumbnail('./document.txt', './output.webp');

// From URL
const thumbnail = await getTextThumbnail('https://example.com/document.txt');

// From Buffer
const buffer = await readFile('./document.txt');
const thumbnail = await getTextThumbnail(buffer);
```

## API

### `getImageThumbnail(image, output?)`

Extracts a thumbnail from an image.

**Parameters:**

- `image` - `string | ArrayBuffer` - Path to image file or ArrayBuffer containing image data
- `output` - `string` (optional) - Output file path for the extracted thumbnail

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

### `getPdfThumbnail(source, output?)`

Generates a thumbnail from a PDF document (first page only).

**Parameters:**

- `source` - `string | Buffer` - Path to PDF file, URL, or Buffer containing PDF data
- `output` - `string` (optional) - Output file path for the generated thumbnail (WebP format)

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

**Output:**

- Format: WebP
- Dimensions: 640x360 pixels
- Rendering: PDF page is scaled to fit within dimensions while maintaining aspect ratio, centered on a white background

### `getTextThumbnail(source, output?)`

Generates a thumbnail preview from a text file (TXT, CSV, MD, etc.).

**Parameters:**

- `source` - `string | Buffer` - Path to text file, URL, or Buffer containing text data
- `output` - `string` (optional) - Output file path for the generated thumbnail (WebP format)

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

**Output:**

- Format: WebP
- Dimensions: 640x360 pixels
- Rendering: Text content rendered on white background with:
  - Dark header bar showing file type (TEXT/CSV)
  - Monospace font for content
  - Auto-wrapped lines that exceed viewport
  - Truncation indicator (...) for long content
  - Support for up to 50 lines or 2000 characters

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run examples
bun run examples/usage.ts
bun run examples/pdf-example.ts
bun run examples/text-example.ts

# Build
bun run build
```

## License

MIT
