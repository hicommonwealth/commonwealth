const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(common, {
  entry: {
    app: 'app.new.tsx',
  },
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
        test: /\.s?css/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
});
