import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { Alias, defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import tsconfigPaths from 'vite-tsconfig-paths';

const projectRootDir = path.resolve(__dirname);

function createClientResolver(folder: string): Alias {
  const find = new RegExp(`^${folder}/(.*)$`);
  return {
    find,
    replacement: path.resolve(
      projectRootDir,
      'client',
      'scripts',
      folder,
      '$1',
    ),
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      entry: './scripts/index.tsx',
      template: './client/index.html',
      inject: {
        data: {
          title: 'index',
          injectScript: `<script src="./inject.js"></script>`,
        },
      },
    }),
    tsconfigPaths(),
  ],
  publicDir: 'static',
  server: {
    port: 8080,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: [
      {
        // matches only non-relative paths that end with .scss
        find: /^([^.].*)\.scss$/,
        replacement: path.resolve(
          projectRootDir,
          'client',
          'styles',
          '$1.scss',
        ),
      },
      createClientResolver('hooks'),
      createClientResolver('navigation'),
      createClientResolver('state'),
      createClientResolver('views'),
      createClientResolver('controllers'),
      createClientResolver('models'),
      createClientResolver('helpers'),
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  define: {
    'process.env.NODE_ENV': 'development',
    'process.env.SERVER_URL': process.env.SERVER_URL,
    'process.env.KNOCK_PUBLIC_API_KEY': process.env.KNOCK_PUBLIC_API_KEY,
    'process.env.KNOCK_IN_APP_FEED_ID': process.env.KNOCK_IN_APP_FEED_ID,
    'process.env.MIXPANEL_DEV_TOKEN':
      process.env.MIXPANEL_DEV_TOKEN || '312b6c5fadb9a88d98dc1fb38de5d900',
    'process.env.MAGIC_PUBLISHABLE_KEY':
      process.env.MAGIC_PUBLISHABLE_KEY || 'pk_live_EF89AABAFB87D6F4',
    'process.env.DISCORD_CLIENT_ID':
      process.env.DISCORD_CLIENT_ID || '1034502265664454776',
    'process.env.DISCORD_UI_URL':
      process.env.DISCORD_UI_URL || 'http://localhost:3000',
    'process.env.COSMOS_GOV_V1': process.env.COSMOS_GOV_V1,
    'process.env.COSMOS_REGISTRY_API': process.env.COSMOS_REGISTRY_API,
    'process.env.FLAG_COMMUNITY_HOMEPAGE': process.env.FLAG_COMMUNITY_HOMEPAGE,
    'process.env.FLAG_PROPOSAL_TEMPLATES': process.env.FLAG_PROPOSAL_TEMPLATES,
    'process.env.FLAG_CONTEST': process.env.FLAG_CONTEST,
    'process.env.ETH_RPC': process.env.ETH_RPC,
    'process.env.FLAG_COMMUNITY_STAKE': process.env.FLAG_COMMUNITY_STAKE,
    'process.env.FLAG_USER_ONBOARDING_ENABLED':
      process.env.FLAG_USER_ONBOARDING_ENABLED,
    'process.env.FLAG_ALLOWLIST': process.env.FLAG_ALLOWLIST,
    'process.env.IS_PRODUCTION': process.env.IS_PRODUCTION,
    'process.env.UNLEASH_FRONTEND_SERVER_URL':
      process.env.UNLEASH_FRONTEND_SERVER_URL,
    'process.env.UNLEASH_FRONTEND_API_TOKEN':
      process.env.UNLEASH_FRONTEND_API_TOKEN,
    'process.env.HEROKU_APP_NAME': process.env.HEROKU_APP_NAME,
    'process.env.FLAG_KNOCK_INTEGRATION_ENABLED':
      process.env.FLAG_KNOCK_INTEGRATION_ENABLED,
    'process.env.FLAG_CONTEST_DEV': process.env.FLAG_CONTEST_DEV,
  },
});
