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

  // WARN: only used locally never in remote (Heroku) apps
  const featureFlags = {
    'process.version': JSON.stringify(''), // necessary to avoid readable-stream error
    'process.env.FLAG_MOBILE_DOWNLOAD': JSON.stringify(
      env.FLAG_MOBILE_DOWNLOAD,
    ),
    'process.env.FLAG_NEW_EDITOR': JSON.stringify(env.FLAG_NEW_EDITOR),
    'process.env.FLAG_CONTEST_DEV': JSON.stringify(env.FLAG_CONTEST_DEV),
    'process.env.FLAG_LAUNCHPAD': JSON.stringify(env.FLAG_LAUNCHPAD),
    'process.env.FLAG_NEW_CONTEST_PAGE': JSON.stringify(
      env.FLAG_NEW_CONTEST_PAGE,
    ),
    'process.env.FLAG_REFERRALS': JSON.stringify(env.FLAG_REFERRALS),
    'process.env.FLAG_ONCHAIN_REFERRALS': JSON.stringify(
      env.FLAG_ONCHAIN_REFERRALS,
    ),
    'process.env.FLAG_REWARDS_PAGE': JSON.stringify(env.FLAG_REWARDS_PAGE),
    'process.env.FLAG_NEW_MOBILE_NAV': JSON.stringify(env.FLAG_NEW_MOBILE_NAV),
    'process.env.FLAG_XP': JSON.stringify(env.FLAG_XP),
    'process.env.FLAG_HOMEPAGE': JSON.stringify(env.FLAG_HOMEPAGE),
    'process.env.FLAG_AI_COMMENTS': JSON.stringify(env.FLAG_AI_COMMENTS),
    'process.env.FLAG_NEW_GOVERNANCE_PAGE': JSON.stringify(
      env.FLAG_NEW_GOVERNANCE_PAGE,
    ),
    'process.env.FLAG_PRIVY': JSON.stringify(env.FLAG_PRIVY),
    'process.env.FLAG_JUDGE_CONTEST': JSON.stringify(env.FLAG_JUDGE_CONTEST),
    'process.env.FLAG_TOKENIZED_THREADS': JSON.stringify(
      env.FLAG_TOKENIZED_THREADS,
    ),
    'process.env.FLAG_TRUST_LEVEL': JSON.stringify(env.FLAG_TRUST_LEVEL),
    'process.env.FLAG_PARTNERSHIP_WALLET': JSON.stringify(
      env.FLAG_PARTNERSHIP_WALLET,
    ),
    'process.env.FLAG_NEW_PROFILE_PAGE': JSON.stringify(
      env.FLAG_NEW_PROFILE_PAGE,
    ),
    'process.env.FLAG_PRIVATE_TOPICS': JSON.stringify(env.FLAG_PRIVATE_TOPICS),
    'process.env.FLAG_CRECIMIENTO_HACKATHON': JSON.stringify(
      env.FLAG_CRECIMIENTO_HACKATHON,
    ),
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
        'eventsource-client',
        'react-datepicker',
        'react-turnstile',
        'react-dom',
        'moment/moment',
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
        '/mcp': {
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
      allowedHosts: ['common.ngrok.app'],
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
      ? {}
      : featureFlags,
  };
});
