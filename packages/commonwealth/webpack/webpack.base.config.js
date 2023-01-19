const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

require('dotenv').config();

module.exports = {
  entry: {
    app: ['app.ts'],
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
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../client/index.html'),
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /\.md$/ }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        bnjs: {
          test: /[\\/]node_modules[\\/]bn.js[\\/]/,
          name: 'bnjs',
          chunks: 'all',
          minSize: 0,
        },
        quill: {
          test: /[\\/]node_modules[\\/]quill[\\/]/,
          name: 'quilljs',
          chunks: 'all',
        },
        secp256k1: {
          test: /[\\/]node_modules[\\/]secp256k1[\\/]/,
          name: 'secp256k1',
          chunks: 'all',
          minSize: 0,
        },
        ethereum: {
          test: /[\\/]node_modules[\\/](web3|ethers|@walletconnect|@ethersproject|ethereumjs-abi|web3-eth-accounts|)[\\/]/,
          name: 'ethereum',
          chunks: 'all',
        },
        near: {
          test: /[\\/]node_modules[\\/](near-api-js)[\\/]/,
          name: 'near',
          chunks: 'all',
        },
        terra: {
          test: /[\\/]node_modules[\\/](@terra-money|terra-proto|legacy-proto)[\\/]/,
          name: 'terra',
          chunks: 'all',
        },
        cosmos: {
          test: /[\\/]node_modules[\\/](cosmjs-types|@cosmjs|@tendermint|amino-js|supercop\.js|tendermint|libsodium)[\\/]/,
          name: 'cosmos',
          chunks: 'all',
        },
        polkadot: {
          test: /[\\/]node_modules[\\/](@polkadot)[\\/]/,
          name: 'polkadot',
          chunks: 'all',
        },
        solana: {
          test: /[\\/]node_modules[\\/](@solana)[\\/]/,
          name: 'solana',
          chunks: 'all',
        },
        snapshot: {
          test: /[\\/]node_modules[\\/](@apollo)[\\/]/,
          name: 'snapshot',
          chunks: 'all',
        },
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
    },
    fallback: {
      fs: false,
      net: false,
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      vm: require.resolve('vm-browserify'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
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
          jsxFragment: 'm.Fragment',
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
