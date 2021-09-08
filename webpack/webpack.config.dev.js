const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  entry: {
    app: [
      'webpack-hot-middleware/client?path=/__webpack_hmr&reload=true',
      'app.ts',
    ],
  },
  mode: 'development',
  target: 'web',
  devtool: 'cheap-eval-source-map',
  output: {
    publicPath: '/build',
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
      CHAT_SERVER: JSON.stringify(process.env.CHAT_SERVER || 'localhost:3001')
    }),
  ],
  module: {
    rules: [
      {
        test: /\.s?css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
      }
    ]
  }
});
