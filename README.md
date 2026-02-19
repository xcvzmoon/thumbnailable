# Thumbnailable

> **⚠️ Development Status**: This project is currently in active development.

A TypeScript library for extracting thumbnails from various document formats.

## Currently Supported

- **Images** - Extract thumbnails from JPEG, PNG, and other image formats using EXIF data

## Planned Support

The following formats will be supported in future releases:

- **PDFs** - Document thumbnails
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

## API

### `getImageThumbnail(image, output?)`

Extracts a thumbnail from an image.

**Parameters:**

- `image` - `string | ArrayBuffer` - Path to image file or ArrayBuffer containing image data
- `output` - `string` (optional) - Output file path for the extracted thumbnail

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run example
bun run examples/usage.ts

# Build
bun run build
```

## License

MIT
