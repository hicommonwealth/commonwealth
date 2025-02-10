import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { Alias, defineConfig, loadEnv } from 'vite';
import handlebars from 'vite-plugin-handlebars';
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

  const unleashConfig = {
    'process.env.UNLEASH_FRONTEND_SERVER_URL': JSON.stringify(
      env.UNLEASH_FRONTEND_SERVER_URL,
    ),
    'process.env.UNLEASH_FRONTEND_API_TOKEN': JSON.stringify(
      env.UNLEASH_FRONTEND_API_TOKEN,
    ),
    'process.env.HEROKU_APP_NAME': JSON.stringify(env.HEROKU_APP_NAME),
  };

  // WARN: only used locally never in remote (Heroku) apps
  const featureFlags = {
    'process.env.FLAG_NEW_EDITOR': JSON.stringify(env.FLAG_NEW_EDITOR),
    'process.env.FLAG_CONTEST_DEV': JSON.stringify(env.FLAG_CONTEST_DEV),
    'process.env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED': JSON.stringify(
      env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED,
    ),
    'process.env.FLAG_FARCASTER_CONTEST': JSON.stringify(
      env.FLAG_FARCASTER_CONTEST,
    ),
    'process.env.FLAG_LAUNCHPAD': JSON.stringify(env.FLAG_LAUNCHPAD),
    'process.env.FLAG_UNISWAP_TRADE': JSON.stringify(env.FLAG_UNISWAP_TRADE),
    'process.env.FLAG_MANAGE_API_KEYS': JSON.stringify(
      env.FLAG_MANAGE_API_KEYS,
    ),
    'process.env.FLAG_REFERRALS': JSON.stringify(env.FLAG_REFERRALS),
    'process.env.FLAG_REWARDS_PAGE': JSON.stringify(env.FLAG_REWARDS_PAGE),
    'process.env.FLAG_STICKY_EDITOR': JSON.stringify(env.FLAG_STICKY_EDITOR),
    'process.env.FLAG_NEW_MOBILE_NAV': JSON.stringify(env.FLAG_NEW_MOBILE_NAV),
    'process.env.FLAG_XP': JSON.stringify(env.FLAG_XP),
    'process.env.FLAG_COMMUNITY_HOME': JSON.stringify(env.FLAG_COMMUNITY_HOME),
    'process.env.FLAG_HOMEPAGE': JSON.stringify(env.FLAG_HOMEPAGE),
    'process.env.FLAG_AI_COMMENTS': JSON.stringify(env.FLAG_AI_COMMENTS),
  };

  const config = {
    'process.version': JSON.stringify(''), // necessary to avoid readable-stream error
    'process.env.APP_ENV': JSON.stringify(env.APP_ENV),
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
    'process.env.KNOCK_PUBLIC_API_KEY': JSON.stringify(
      env.KNOCK_PUBLIC_API_KEY,
    ),
    'process.env.KNOCK_IN_APP_FEED_ID': JSON.stringify(
      env.KNOCK_IN_APP_FEED_ID,
    ),
    // FARCASTER_NGROK_DOMAIN should only be setup on local development
    'process.env.FARCASTER_NGROK_DOMAIN': JSON.stringify(
      env.FARCASTER_NGROK_DOMAIN,
    ),
    'process.env.MIXPANEL_DEV_TOKEN':
      JSON.stringify(env.MIXPANEL_DEV_TOKEN) ||
      JSON.stringify('312b6c5fadb9a88d98dc1fb38de5d900'),
    'process.env.MIXPANEL_PROD_TOKEN': JSON.stringify(env.MIXPANEL_PROD_TOKEN),
    'process.env.MAGIC_PUBLISHABLE_KEY':
      JSON.stringify(env.MAGIC_PUBLISHABLE_KEY) ||
      JSON.stringify('pk_live_EF89AABAFB87D6F4'),
    'process.env.DISCORD_CLIENT_ID':
      JSON.stringify(env.DISCORD_CLIENT_ID) ||
      JSON.stringify('1027997517964644453'),
    'process.env.SNAPSHOT_HUB_URL': JSON.stringify(env.SNAPSHOT_HUB_URL),
    'process.env.COSMOS_REGISTRY_API': JSON.stringify(env.COSMOS_REGISTRY_API),
    'process.env.ETH_RPC': JSON.stringify(env.ETH_RPC),
    'process.env.ALCHEMY_PUBLIC_APP_KEY':
      (env.ETH_RPC || '').trim() === 'e2e-test' &&
      (env.NODE_ENV || '').trim() === 'test'
        ? JSON.stringify(env.ALCHEMY_PUBLIC_APP_KEY)
        : undefined,
  };

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
      handlebars({
        // Handlebars context: pass key-value pairs to index.html
        context: {
          FARCASTER_MANIFEST_DOMAIN: env.FARCASTER_MANIFEST_DOMAIN,
        },
      }),
    ],
    optimizeDeps: {
      include: [
        '@atomone/govgen-types-long/govgen/gov/v1beta1/gov',
        '@atomone/govgen-types-long/govgen/gov/v1beta1/tx.amino',
        '@atomone/govgen-types-long/govgen/gov/v1beta1/query',
        'react-virtuoso',
        'bn.js',
        'commonwealth-mdxeditor',
        'quill-magic-url',
        'react-beautiful-dnd',
        'react-quill',
        '@tanstack/react-table',
        'quill-image-drop-and-paste',
        'quill-mention',
        '@snapshot-labs/snapshot.js',
        'graphql-request',
        'is-ipfs',
        '@cosmjs/stargate/build/queryclient',
        'cosmjs-types/cosmos/distribution/v1beta1/distribution',
        'cosmjs-types/cosmos/gov/v1beta1/gov',
        'cosmjs-types/google/protobuf/any',
        '@cosmjs/tendermint-rpc',
        '@cosmjs/proto-signing',
        '@cosmjs/utils',
        'cosmjs-types/cosmos/crypto/secp256k1/keys.js',
        'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js',
        'cosmjs-types/cosmos/tx/v1beta1/tx.js',
        'long',
        '@osmonauts/lcd',
        'protobufjs/minimal',
        'underscore',
        'react-router',
        '@lexical/rich-text',
        'lexical',
        'numeral',
        'firebase/app',
        'firebase/messaging',
      ],
    },
    build: {
      outDir: '../build',
      // UNISWAP_WIDGET_HACK: this is needed by @uniswap to resolved multiple dependencies issues with peer-deps
      commonjsOptions: {
        transformMixedEsModules: true,
      },
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
        // farcaster manifest is dynamically generated, not a static file
        '/.well-known/farcaster.json': {
          target: env.BACKEND_PROXY_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: [
        {
          // UNISWAP_WIDGET_HACK: 'jsbi' is needed by @uniswap pkg for pricing calculations, this is
          // not documented by the uniswap pkg or atleast i couldn't find it.
          // adding this here for internal uniswap widget import resolution
          // see: https://github.com/Uniswap/sdk-core/issues/20 and
          // https://github.com/Uniswap/widgets/issues/586#issuecomment-1777323003
          // for more details
          find: 'jsbi',
          replacement: path.resolve(
            __dirname,
            '../node_modules/jsbi/dist/jsbi-cjs.js',
          ),
        },
        {
          // UNISWAP_WIDGET_HACK: needed by @uniswap pkg for path resolution
          // see: https://github.com/Uniswap/widgets/issues/593#issuecomment-1777415001 for more details
          find: '~@fontsource/ibm-plex-mono',
          replacement: '@fontsource/ibm-plex-mono',
        },
        {
          // UNISWAP_WIDGET_HACK: needed by @uniswap pkg for path resolution
          // see: https://github.com/Uniswap/widgets/issues/593#issuecomment-1777415001 for more details
          find: '~@fontsource/inter',
          replacement: '@fontsource/inter',
        },
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
    // Vite built env var are disabled in all remote apps (only enabled in local/CI environments)
    define: !['local', 'CI'].includes((env.APP_ENV ?? '')!.trim())
      ? { ...unleashConfig, ...config }
      : {
          ...unleashConfig,
          ...config,
          ...featureFlags,
        },
  };
});
