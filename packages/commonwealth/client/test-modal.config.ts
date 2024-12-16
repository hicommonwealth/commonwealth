import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'scripts'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./styles/shared.scss";`,
      },
    },
  },
  server: {
    port: 8081,
    host: true,
  },
});
