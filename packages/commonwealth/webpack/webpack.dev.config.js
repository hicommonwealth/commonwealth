const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.base.config.js');
const { DuplicatesPlugin } = require("inspectpack/plugin");

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
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].chunk.js',
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
    new DuplicatesPlugin({
      // Emit compilation warning or error? (Default: `false`)
      emitErrors: false,
      // Display full duplicates information? (Default: `false`)
      verbose: false
    }),
  ],
});

// if we are building locally in server.ts, add hot-middleware as entrypoint
if (!process.env.EXTERNAL_WEBPACK) {
  module.exports = merge(module.exports, {
    entry: {
      app: [
        'webpack-hot-middleware/client?path=/__webpack_hmr&reload=true',
      ]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(), // used for hot reloading
    ]
  });
}