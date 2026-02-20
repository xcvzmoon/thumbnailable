# Thumbnailable

> **⚠️ Development Status**: This project is currently in active development.

A TypeScript library for extracting thumbnails from various document formats.

## Currently Supported

- **Images** - Extract thumbnails from JPEG, PNG, and other image formats using EXIF data
- **PDFs** - Generate thumbnails from PDF documents (first page, 640x360 centered)
- **Text files** - Generate thumbnails from text files (TXT, CSV, MD, etc.)
- **Excel** - Generate thumbnails from Excel spreadsheets (XLSX, XLS)
- **Word** - Generate thumbnails from Word documents (DOC, DOCX)

## Planned Support

The following formats will be supported in future releases:

- **PPTX** - Microsoft PowerPoint presentations

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

### Excel Thumbnails

```typescript
import { getExcelThumbnail } from 'thumbnailable';

// From file path
const thumbnail = await getExcelThumbnail('./spreadsheet.xlsx');

// From file path with output
const thumbnail = await getExcelThumbnail('./spreadsheet.xlsx', './output.webp');

// From Buffer
const buffer = await readFile('./spreadsheet.xlsx');
const thumbnail = await getExcelThumbnail(buffer);
```

### Word Thumbnails

```typescript
import { getWordThumbnail } from 'thumbnailable';

// From file path
const thumbnail = await getWordThumbnail('./document.docx');

// From file path with output
const thumbnail = await getWordThumbnail('./document.docx', './output.webp');

// From Buffer
const buffer = await readFile('./document.docx');
const thumbnail = await getWordThumbnail(buffer);
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

### `getExcelThumbnail(source, output?)`

Generates a thumbnail preview from an Excel spreadsheet (first sheet only).

**Parameters:**

- `source` - `string | Buffer` - Path to Excel file or Buffer containing Excel data
- `output` - `string` (optional) - Output file path for the generated thumbnail (WebP format)

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

**Output:**

- Format: WebP
- Dimensions: 640x360 pixels
- Rendering: Spreadsheet content on white background with:
  - Gridlines
  - Header row highlighting
  - Up to 20 rows and 6 columns
  - Truncation indicator for long content

### `getWordThumbnail(source, output?)`

Generates a thumbnail preview from a Word document (DOC or DOCX).

**Parameters:**

- `source` - `string | Buffer` - Path to Word file or Buffer containing Word document data
- `output` - `string` (optional) - Output file path for the generated thumbnail (WebP format)

**Returns:** `Promise<ArrayBuffer>` - The thumbnail as an ArrayBuffer

**Output:**

- Format: WebP
- Dimensions: 640x360 pixels
- Rendering: Document content on white background with:
  - Serif font (Times New Roman)
  - Up to 20 lines of content
  - Truncation indicator (...) for long content

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
bun run examples/excel-example.ts
bun run examples/word-example.ts

# Build
bun run build
```

## License

MIT
