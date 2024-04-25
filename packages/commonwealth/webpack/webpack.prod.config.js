const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.base.config.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { WebpackDeduplicationPlugin } = require('webpack-deduplication-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  stats: 'errors-only',
  bail: true,
  output: {
    publicPath: '/build/',
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
  },
  resolve: {
    fallback: {
      events: require.resolve('events'),
      buffer: require.resolve('buffer'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new WebpackDeduplicationPlugin({
      cacheDir: './cache',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../favicon.ico'),
          to: path.resolve(__dirname, '../build/favicon.ico'),
        },
      ],
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled', // 'server',
      generateStatsFile: false, // true,
      statsOptions: { source: false }, // { source: true },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        include: [
          path.resolve(__dirname, '../client'),
          path.resolve(__dirname, '../shared'),
        ],
        exclude: /\/node_modules\//,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
});
