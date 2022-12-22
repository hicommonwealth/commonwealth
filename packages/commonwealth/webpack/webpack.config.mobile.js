const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(common, {
  entry: {
    app: 'app.ts',
  },
  mode: 'production',
  stats: 'errors-only',
  bail: true,
  output: {
    publicPath: '/',
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].[hash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL),
      // SERVICE_URL: JSON.stringify((process.env.NODE_ENV ==='production') ? 'https://commonwealth.im' :
      //   (process.env.NODE_ENV ==='staging') ? `https://commonwealth-staging.herokuapp.com` :
      //     (process.env.NODE_ENV ==='device') ? process.env.SERVICE_URL : `http://localhost:8080`),
      CHAT_SERVER: JSON.stringify('commonwealthchat.herokuapp.com')
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.s?css/i,
        use : ['style-loader', 'css-loader', 'sass-loader']
      },
      // patch import for process/browser, so yarn build-ios works
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ]
  }
});
