const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.base.config.js');

const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://commonwealth.im';
  } else if (process.env.NODE_ENV === 'staging') {
    return 'https://commonwealth-staging.herokuapp.com/api';
  } else if (process.env.NODE_ENV === 'mobile') {
    return process.env.SERVICE_URL;
  } else {
    return 'http://localhost:8080/api';
  }
};

module.exports = merge(common, {
  mode: 'production',
  stats: 'errors-only',
  bail: true,
  optimization: { minimize: false },
  output: {
    publicPath: '/',
    path: path.join(__dirname, '../build'),
    filename: 'js/[name].[hash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.SERVER_URL': JSON.stringify(getServerUrl()),
    }),
  ],
});
