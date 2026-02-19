# Agent Instructions

This document provides guidelines for AI agents working in this repository.

## Build & Test Commands

```bash
# Development
bun run dev              # Run with hot reload

# Build
bun run build            # Build with tsdown

# Testing
bun run test             # Run all tests with vitest
bun run test:watch       # Run tests in watch mode
vitest run tests/images.test.ts    # Run single test file
bun test tests/images.test.ts -t "test name"   # Run specific test

# Code Quality
bun run lint             # Run oxlint with type-aware checks
bun run format           # Format with oxfmt and verify
```

**Always run tests and lint after making changes.**

## Code Style Guidelines

### Imports

- Use `node:` prefix for Node.js built-ins: `import { readFile } from 'node:fs/promises'`
- Group imports: 1) node: builtins, 2) external deps, 3) local modules
- No semicolons at end of statements
- Use single quotes for strings

### Types & Naming

- TypeScript strict mode enabled - types are required
- Use camelCase for variables/functions: `getImageThumbnail`, `tmpSourceFile`
- Use PascalCase for types/interfaces
- Explicit return types on exported functions when not obvious
- Prefer `const` and `let` over `var`

### Functions

- Use `export async function` for public async functions
- Use optional parameters with `?`: `output?: string`
- Keep functions focused and under 50 lines when possible

### Error Handling

- Use try/catch/finally for cleanup operations
- Log errors with context before re-throwing: `console.error('message', error)`
- Cleanup temp files in finally block with `.catch(() => {})` to ignore errors

### Testing (Vitest)

- Use `describe` to group tests by functionality
- Use nested `describe` for input variations (e.g., `when input is...`)
- Test names should describe behavior in plain English: `returns a valid thumbnail ArrayBuffer`
- Create helper functions for repeated assertions
- Use `__dirname` and `join()` for test file paths - never hardcode absolute paths

### Formatting

- 2-space indentation
- No trailing spaces
- One blank line between functions
- No blank line at end of file

## Project Structure

- `src/` - Source code
- `tests/` - Test files (use `.test.ts` suffix)
- Uses ES modules with bundler resolution
- Package manager: bun

## Dependencies

- `exiftool-vendored` for image thumbnail extraction
- `vitest` for testing
- `oxlint` and `oxfmt` for linting/formatting
- `tsdown` for building
