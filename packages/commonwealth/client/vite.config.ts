import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { Alias, defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

const projectRootDir = path.resolve(__dirname);

function createScriptsResolver(folder: string): Alias {
  const find = new RegExp(`^${folder}/(.*)$`);
  return {
    find,
    replacement: path.resolve(projectRootDir, 'scripts', folder, '$1'),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envPath = path.dirname(path.dirname(process.cwd())); // root project .env
  const env = loadEnv(mode, envPath, '');
  return {
    root: projectRootDir,
    plugins: [
      react(),
      createHtmlPlugin({
        entry: `./scripts/index.tsx`,
        template: './index.html',
      }),
      tsconfigPaths(),
      nodePolyfills(),
    ],
    build: {
      outDir: '../build',
    },
    server: {
      port: 8080,
      host: 'localhost',
      proxy: {
        '/api': {
          target: env.BACKEND_PROXY_URL || 'http://localhost:3000',
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
          replacement: path.resolve(projectRootDir, 'styles', '$1.scss'),
        },
        {
          // resolves assets/
          find: /^assets\/(.*)$/,
          replacement: path.resolve(projectRootDir, 'assets', '$1'),
        },
        createScriptsResolver('hooks'),
        createScriptsResolver('navigation'),
        createScriptsResolver('state'),
        createScriptsResolver('views'),
        createScriptsResolver('controllers'),
        createScriptsResolver('models'),
        createScriptsResolver('helpers'),
      ],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    define: {
      'process.version': JSON.stringify(''), // necessary to avoid readable-stream error
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
      'process.env.KNOCK_PUBLIC_API_KEY': JSON.stringify(
        env.KNOCK_PUBLIC_API_KEY,
      ),
      'process.env.KNOCK_IN_APP_FEED_ID': JSON.stringify(
        env.KNOCK_IN_APP_FEED_ID,
      ),
      'process.env.MIXPANEL_DEV_TOKEN':
        JSON.stringify(env.MIXPANEL_DEV_TOKEN) ||
        JSON.stringify('312b6c5fadb9a88d98dc1fb38de5d900'),
      'process.env.MAGIC_PUBLISHABLE_KEY':
        JSON.stringify(env.MAGIC_PUBLISHABLE_KEY) ||
        JSON.stringify('pk_live_EF89AABAFB87D6F4'),
      'process.env.DISCORD_CLIENT_ID':
        JSON.stringify(env.DISCORD_CLIENT_ID) ||
        JSON.stringify('1034502265664454776'),
      'process.env.DISCORD_UI_URL':
        JSON.stringify(env.DISCORD_UI_URL) ||
        JSON.stringify('http://localhost:3000'),
      'process.env.COSMOS_GOV_V1': JSON.stringify(env.COSMOS_GOV_V1),
      'process.env.COSMOS_REGISTRY_API': JSON.stringify(
        env.COSMOS_REGISTRY_API,
      ),
      'process.env.FLAG_COMMUNITY_HOMEPAGE': JSON.stringify(
        env.FLAG_COMMUNITY_HOMEPAGE,
      ),
      'process.env.FLAG_PROPOSAL_TEMPLATES': JSON.stringify(
        env.FLAG_PROPOSAL_TEMPLATES,
      ),
      'process.env.FLAG_CONTEST': JSON.stringify(env.FLAG_CONTEST),
      'process.env.ETH_RPC': JSON.stringify(env.ETH_RPC),
      'process.env.FLAG_ALLOWLIST': JSON.stringify(env.FLAG_ALLOWLIST),
      'process.env.IS_PRODUCTION': JSON.stringify(env.IS_PRODUCTION),
      'process.env.UNLEASH_FRONTEND_SERVER_URL': JSON.stringify(
        env.UNLEASH_FRONTEND_SERVER_URL,
      ),
      'process.env.UNLEASH_FRONTEND_API_TOKEN': JSON.stringify(
        env.UNLEASH_FRONTEND_API_TOKEN,
      ),
      'process.env.HEROKU_APP_NAME': JSON.stringify(env.HEROKU_APP_NAME),
      'process.env.FLAG_KNOCK_INTEGRATION_ENABLED': JSON.stringify(
        env.FLAG_KNOCK_INTEGRATION_ENABLED,
      ),
      'process.env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED': JSON.stringify(
        env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED,
      ),
      'process.env.FLAG_CONTEST_DEV': JSON.stringify(env.FLAG_CONTEST_DEV),
      'process.env.ETH_ALCHEMY_API_KEY':
        (env.ETH_RPC || '').trim() === 'e2e-test' &&
        (env.NODE_ENV || '').trim() === 'test'
          ? JSON.stringify(env.ETH_ALCHEMY_API_KEY)
          : undefined,
    },
  };
});
