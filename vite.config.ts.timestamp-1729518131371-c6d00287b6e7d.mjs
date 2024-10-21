// ../../vite.config.ts
import tsconfigPaths from 'file:///Users/kurtis/commonwealth/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.4.5_vite@5.2.12_@types+node@20.12.10_sass@1.77.0_terser@5.34.1_/node_modules/vite-tsconfig-paths/dist/index.mjs';
import { defineConfig } from 'file:///Users/kurtis/commonwealth/node_modules/.pnpm/vite@5.2.12_@types+node@20.12.10_sass@1.77.0_terser@5.34.1/node_modules/vite/dist/node/index.js';
import path from 'path';
var __vite_injected_original_dirname = '/Users/kurtis/commonwealth';
var vite_config_default = defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: path.resolve(
      __vite_injected_original_dirname,
      './libs/model/src/tester/vitestDatabaseSetup.ts',
    ),
    coverage: {
      provider: 'istanbul',
      reporter:
        process.env.CI === 'true'
          ? ['lcovonly']
          : ['text', ['json', { file: 'coverage.json' }], 'html'],
      reportsDirectory: './coverage',
    },
  },
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vdml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva3VydGlzL2NvbW1vbndlYWx0aFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2t1cnRpcy9jb21tb253ZWFsdGgvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2t1cnRpcy9jb21tb253ZWFsdGgvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3RzY29uZmlnUGF0aHMoKV0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxTZXR1cDogcGF0aC5yZXNvbHZlKFxuICAgICAgX19kaXJuYW1lLFxuICAgICAgJy4vbGlicy9tb2RlbC9zcmMvdGVzdGVyL3ZpdGVzdERhdGFiYXNlU2V0dXAudHMnLFxuICAgICksXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAnaXN0YW5idWwnLFxuICAgICAgcmVwb3J0ZXI6XG4gICAgICAgIHByb2Nlc3MuZW52LkNJID09PSAndHJ1ZSdcbiAgICAgICAgICA/IFsnbGNvdm9ubHknXVxuICAgICAgICAgIDogWyd0ZXh0JywgWydqc29uJywgeyBmaWxlOiAnY292ZXJhZ2UuanNvbicgfV0sICdodG1sJ10sXG4gICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZScsXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLG1CQUFtQjtBQUoxQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsY0FBYyxDQUFDO0FBQUEsRUFDekIsTUFBTTtBQUFBLElBQ0osYUFBYSxLQUFLO0FBQUEsTUFDaEI7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsVUFDRSxRQUFRLElBQUksT0FBTyxTQUNmLENBQUMsVUFBVSxJQUNYLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDLEdBQUcsTUFBTTtBQUFBLE1BQzFELGtCQUFrQjtBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
