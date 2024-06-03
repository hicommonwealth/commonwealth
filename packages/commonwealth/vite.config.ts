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
export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      createHtmlPlugin({
        entry: `./${command === 'serve' ? 'client/' : ''}scripts/index.tsx`,
        template: './client/index.html',
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
      global: {},
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL),
      'process.env.KNOCK_PUBLIC_API_KEY': JSON.stringify(
        process.env.KNOCK_PUBLIC_API_KEY,
      ),
      'process.env.KNOCK_IN_APP_FEED_ID': JSON.stringify(
        process.env.KNOCK_IN_APP_FEED_ID,
      ),
      'process.env.MIXPANEL_DEV_TOKEN':
        JSON.stringify(process.env.MIXPANEL_DEV_TOKEN) ||
        JSON.stringify('312b6c5fadb9a88d98dc1fb38de5d900'),
      'process.env.MAGIC_PUBLISHABLE_KEY':
        JSON.stringify(process.env.MAGIC_PUBLISHABLE_KEY) ||
        JSON.stringify('pk_live_EF89AABAFB87D6F4'),
      'process.env.DISCORD_CLIENT_ID':
        JSON.stringify(process.env.DISCORD_CLIENT_ID) ||
        JSON.stringify('1034502265664454776'),
      'process.env.DISCORD_UI_URL':
        JSON.stringify(process.env.DISCORD_UI_URL) ||
        JSON.stringify('http://localhost:3000'),
      'process.env.COSMOS_GOV_V1': JSON.stringify(process.env.COSMOS_GOV_V1),
      'process.env.COSMOS_REGISTRY_API': JSON.stringify(
        process.env.COSMOS_REGISTRY_API,
      ),
      'process.env.FLAG_COMMUNITY_HOMEPAGE': JSON.stringify(
        process.env.FLAG_COMMUNITY_HOMEPAGE,
      ),
      'process.env.FLAG_PROPOSAL_TEMPLATES': JSON.stringify(
        process.env.FLAG_PROPOSAL_TEMPLATES,
      ),
      'process.env.FLAG_CONTEST': JSON.stringify(process.env.FLAG_CONTEST),
      'process.env.ETH_RPC': JSON.stringify(process.env.ETH_RPC),
      'process.env.FLAG_COMMUNITY_STAKE': JSON.stringify(
        process.env.FLAG_COMMUNITY_STAKE,
      ),
      'process.env.FLAG_USER_ONBOARDING_ENABLED': JSON.stringify(
        process.env.FLAG_USER_ONBOARDING_ENABLED,
      ),
      'process.env.FLAG_ALLOWLIST': JSON.stringify(process.env.FLAG_ALLOWLIST),
      'process.env.IS_PRODUCTION': JSON.stringify(process.env.IS_PRODUCTION),
      'process.env.UNLEASH_FRONTEND_SERVER_URL': JSON.stringify(
        process.env.UNLEASH_FRONTEND_SERVER_URL,
      ),
      'process.env.UNLEASH_FRONTEND_API_TOKEN': JSON.stringify(
        process.env.UNLEASH_FRONTEND_API_TOKEN,
      ),
      'process.env.HEROKU_APP_NAME': JSON.stringify(
        process.env.HEROKU_APP_NAME,
      ),
      'process.env.FLAG_KNOCK_INTEGRATION_ENABLED': JSON.stringify(
        process.env.FLAG_KNOCK_INTEGRATION_ENABLED,
      ),
      'process.env.FLAG_CONTEST_DEV': JSON.stringify(
        process.env.FLAG_CONTEST_DEV,
      ),
    },
  };
});
