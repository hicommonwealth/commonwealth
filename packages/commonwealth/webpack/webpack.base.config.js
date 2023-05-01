const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');

require('dotenv').config();

function createDependencyRegex(dependencies) {
  const escapedDependencies = dependencies.map(dep => dep.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
  return new RegExp(`^(${escapedDependencies.join('|')})$`);
}

const bnJsV4Dependencies = [
  '@walletconnect/utils',
  'rlp',
  'eth-lib',
  'ethjs-unit',
  'number-to-bn',
  'ethereumjs-tx',
  'merkle-patricia-tree',
  'eth-sig-util',
  'ethereumjs-abi#ethereumjs-util',
  'ethereumjs-util#rlp',
  '@terra-money/wallet-controller',
  'create-ecdh',
  'diffie-hellman',
  'public-encrypt',
  'browserify-sign',
  'ganache-cli',
  '@metamask/eth-sig-util',
  'ethereumjs-abi#rlp',
  'commonwealth#rlp',
  'web3-utils#rlp',
  'ethereumjs-tx#elliptic',
  'merkle-patricia-tree#elliptic',
  'eth-sig-util#elliptic',
  'web3-provider-engine',
  'passport-magic',
  'ethereumjs-abi#ethereumjs-util#rlp',
  'commonwealth#ethereumjs-abi#rlp',
  'web3-utils#ethereumjs-abi#rlp',
  'ethjson-rpc-middleware',
  '@metamask/eth-sig-util',
  'ethereumjs-abi#ethereumjs-util#elliptic',
  'commonwealth#ethereumjs-abi#elliptic',
  'web3-utils#ethereumjs-abi#elliptic',
  'passport-magic#ethereumjs-abi#ethereumjs-util#elliptic',
  'eth-json-rpc-middleware#elliptic',
  '@metamask/eth-sig-util#ethereumjs-util#elliptic',
  'ethereumjs-account#elliptic',
  'ethereumjs-vm#elliptic',
  '@magic-sdk/provider#rlp',
  'commonwealth',
];

const bnJsV5Dependencies = [
  '@solana/web3.js',
  'ethereumjs-util',
  'chain-events',
  '@ethersproject/bignumber',
  '@ethersproject/signing-key',
  'web3-eth-iban',
  'web3-utils',
  'near-api-js',
  'borsh',
  'commonwealth#ethereumjs-util',
  'web3-utils#ethereumjs-util',
  'ethereumjs-wallet',
  'web3-core-method',
  '@walletconnect/core',
  '@walletconnect/iso-crypto',
  'miller-rabin',
  'browserify-rsa',
  '@magic-sdk/provider#ethereumjs-util',
];

module.exports = {
  entry: {
    app: ['index.tsx'],
  },
  context: __dirname,
  devServer: {
    headers: {
      P3P: 'CP="Commonwealth does not have a P3P compact privacy policy"',
    },
  },
  output: {
    publicPath: '/build/',
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.MAGIC_PUBLISHABLE_KEY': JSON.stringify(
        process.env.MAGIC_PUBLISHABLE_KEY || 'pk_live_EF89AABAFB87D6F4'
      ),
    }),
    new webpack.DefinePlugin({
      'process.env.DISCORD_CLIENT_ID': JSON.stringify(
        process.env.DISCORD_CLIENT_ID || '1034502265664454776'
      ),
    }),
    new webpack.DefinePlugin({
      'process.env.DISCORD_UI_URL': JSON.stringify(
        process.env.DISCORD_UI_URL || 'http://localhost:3000'
      ),
    }),
    new webpack.DefinePlugin({
      'process.env.COSMOS_GOV_V1': JSON.stringify(process.env.COSMOS_GOV_V1),
    }),
    new webpack.DefinePlugin({
      'process.env.FLAG_COMMUNITY_HOMEPAGE': JSON.stringify(
        process.env.FLAG_COMMUNITY_HOMEPAGE
      ),
    }),
    new webpack.DefinePlugin({
      'process.env.FLAG_PROPOSAL_TEMPLATES': JSON.stringify(
          process.env.FLAG_PROPOSAL_TEMPLATES
      ),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../client/index.html'),
      attributes: {
        'data-cfasync': 'false',
      },
    }),
    new HtmlWebpackInjectAttributesPlugin(),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /\.md$/ }),
    new webpack.NormalModuleReplacementPlugin(
      createDependencyRegex(bnJsV5Dependencies),
      resource => {
        if (resource.request.includes('bn.js')) {
          resource.request = resource.request.replace('bn.js', 'bn.js-v5');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      createDependencyRegex(bnJsV4Dependencies),
      resource => {
        if (resource.request.includes('bn.js')) {
          resource.request = resource.request.replace('bn.js', 'bn.js-v4');
        }
      }
    ),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      // TODO: Commented out packages need to be code split. Commented out for now so that webpack can tree shake the imports
      cacheGroups: {
        bitcoin: {
          test: /[\\/]node_modules[\\/](bip39)[\\/]/,
          name: 'bitcoin',
          chunks: 'all',
        },
        ethereum: {
          // this is made into an inital chunk
          test: /[\\/]node_modules[\\/](@ethersproject)[\\/]/,
          name: 'ethereum',
          chunks: 'all',
        },
        ethereumAsync: {
          // this is made into an async chunk (lazy loaded)
          test: /[\\/]node_modules[\\/](web3|@audius|ethers|web3-eth-accounts|@walletconnect|ethereumjs-abi)[\\/]/,
          name: 'ethereumAsync',
          chunks: 'all',
        },
        terra: {
          test: /[\\/]node_modules[\\/](@terra-money|terra-proto|legacy-proto)[\\/]/,
          name: 'terra',
          chunks: 'all',
        },
        cosmos: {
          test: /[\\/]node_modules[\\/](@cosmjs|@tendermint|amino-js|supercop\.js|tendermint|libsodium)[\\/]/,
          name: 'cosmos',
          chunks: 'all',
        },
        solana: {
          test: /[\\/]node_modules[\\/](@solana)[\\/]/,
          name: 'solana',
          chunks: 'all',
        },
        snapshot: {
          test: /[\\/]node_modules[\\/](@snapshot-labs|@apollo)[\\/]/,
          name: 'snapshot',
          chunks: 'all',
        },
        // near: {
        //   test: /[\\/]node_modules[\\/](near-api-js)[\\/]/,
        //   name: 'near',
        //   chunks: 'all',
        // },
        // cosmosTypes: {
        //   test: /[\\/]node_modules[\\/](cosmjs-types)[\\/]/,
        //   name: 'cosmosTypes',
        //   chunks: 'all',
        // },
        // polkadot: {
        //   test: /[\\/]node_modules[\\/](@polkadot)[\\/]/,
        //   name: 'polkadot',
        //   chunks: 'all',
        // },
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.svg'],
    modules: [
      '../client/scripts',
      '../client/styles',
      '../shared',
      'node_modules', // local node modules
      '../node_modules', // global node modules
    ],
    alias: {
      'common-common': path.resolve(__dirname, '../../common-common'),
      'chain-events': path.resolve(__dirname, '../../chain-events'),
      'token-balance-cache': path.resolve(
        __dirname,
        '../../token-balance-cache'
      ),
      'bn.js-v5': path.resolve(__dirname, '../node_modules/@ethersproject/bignumber/node_modules/bn.js'),
      'bn.js-v4': path.resolve(__dirname, '../../../node_modules/bn.js'), // Alias for version 4.x.x
      // 'bn.js': path.resolve(__dirname, '../node_modules/bn.js'), // Add this line to alias bn.js
    },
    fallback: {
      fs: false,
      net: false,
      zlib: require.resolve('browserify-zlib'),
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      vm: require.resolve('vm-browserify'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
    },
  },
  module: {
    rules: [
      {
        // ignore ".spec.ts" test files in build
        test: /^(?!.*\.spec\.ts$).*(?:\.ts)$/,
        include: [
          path.resolve(__dirname, '../client'),
          path.resolve(__dirname, '../shared'),
          path.resolve(__dirname, '../../common-common'),
          path.resolve(__dirname, '../../chain-events'),
          path.resolve(__dirname, '../../token-balance-cache'),
        ],
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
        },
      },
      {
        // ignore ".spec.ts" test files in build
        test: /^(?!.*\.spec\.tsx$).*(?:\.tsx)$/,
        include: [path.resolve(__dirname, '../client')],
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          jsxFragment: 'React.Fragment',
        },
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        type: 'asset',
      },
      {
        test: /\.s?css$/i,
        use: ['style-loader', 'css-loader', 'fast-sass-loader'],
        sideEffects: true,
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
};
