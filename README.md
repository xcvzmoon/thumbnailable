# Thumbnailable

> **⚠️ Development Status**: This project is currently in active development.

A TypeScript library for extracting thumbnails from various document formats.

## Currently Supported

- **Images** - Extract thumbnails from JPEG, PNG, and other image formats using EXIF data
- **PDFs** - Generate thumbnails from PDF documents (first page, 640x360 centered)

## Planned Support

The following formats will be supported in future releases:

- **DOCX** - Microsoft Word documents
- **PPTX** - Microsoft PowerPoint presentations
- **Excel** - Microsoft Excel spreadsheets (XLSX, XLS)
- **Text files** - Plain text (TXT) and CSV files

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

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run examples
bun run examples/usage.ts
bun run examples/pdf-example.ts

# Build
bun run build
```

## License

MIT
