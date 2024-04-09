import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { WebpackDeduplicationPlugin } from 'webpack-deduplication-plugin';
import { merge } from 'webpack-merge';
import baseConfig from './webpack.base.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default merge(baseConfig, {
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
