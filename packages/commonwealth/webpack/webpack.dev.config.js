const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.base.config.js');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = merge(common, {
  entry: {
    app: ['webpack-hot-middleware/client?path=/__webpack_hmr&reload=true'],
  },
  mode: 'development',
  devtool: 'eval-cheap-source-map',
  stats: {
    assets: false,
    modules: false,
  },
  ignoreWarnings: [
    { module: /client\/styles\/construct.scss/ },
    { module: /node_modules\/magic-sdk\/dist\/es\/index.mjs/ },
  ],
  target: 'web',
  output: {
    publicPath: '/build',
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  },
  devServer: {
    inline: true,
    hot: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      CHAT_SERVER: JSON.stringify(process.env.CHAT_SERVER || 'localhost:3001'),
    }),
    new webpack.HotModuleReplacementPlugin(), // used for hot reloading
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({ minimizerOptions: { preset: ['default'] } }),
    ],
  },
});
