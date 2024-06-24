import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: './' })],
  build: {
    outDir: './build',
    minify: false,
    rollupOptions: {
      input: {
        main: './test/browser/browser.spec.ts',
      },
      external: ['k6', 'k6/experimental/browser'],
      output: {
        // Preserve the directory structure
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@hicommonwealth/model',
        replacement: '../../libs/model/src',
      },
    ],
  },
});
