import { defineConfig } from 'tsdown';

export default defineConfig({
  external: 'bun',
  entry: './src/index.ts',
  dts: true,
  minify: true,
});
