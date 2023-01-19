const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.base.config.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      CHAT_SERVER: JSON.stringify('commonwealthchat.herokuapp.com'),
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
      statsOptions: { source: false },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        include: [
          path.resolve(__dirname, '../client'),
          path.resolve(__dirname, '../shared'),
          path.resolve(__dirname, '../../common-common'),
          path.resolve(__dirname, '../../chain-events'),
          path.resolve(__dirname, '../../token-balance-cache'),
        ],
        exclude: /\/node_modules\//,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({ minimizerOptions: { preset: ['default'] } }),
    ],
  },
});
