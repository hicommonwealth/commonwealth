const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  node: {
    fs: 'empty',
    net: 'empty'
  },
  context: __dirname,
  devServer: {
    headers: {
      'P3P': 'CP="Commonwealth does not have a P3P compact privacy policy"',
    },
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, '../static'), to: 'static' },
    ]),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../client/index.html')
    }),
    new MomentLocalesPlugin(), // strip all locales except “en”
    new webpack.optimize.OccurrenceOrderPlugin(), // used for hot reloading
    new webpack.HotModuleReplacementPlugin(), // used for hot reloading
    new webpack.NoEmitOnErrorsPlugin(), // used for hot reloading
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        bitcoin: {
          test: /[\\/]node_modules[\\/](bip39)[\\/]/,
          name: 'bitcoin',
          chunks: 'all',
        },
        ethereum: {
          test: /[\\/]node_modules[\\/](web3|@audius|ethers)[\\/]/,
          name: 'ethereum',
          chunks: 'all',
        },
        near: {
          test: /[\\/]node_modules[\\/](nearlib)[\\/]/,
          name: 'near',
          chunks: 'all',
        },
        cosmos: {
          test: /[\\/]node_modules[\\/](@cosmjs|@tendermint|amino-js|supercop\.js|tendermint)[\\/]/,
          name: 'cosmos',
          chunks: 'all',
        },
        polkadot: {
          test: /[\\/]node_modules[\\/](@polkadot)[\\/]/,
          name: 'polkadot',
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
      'node_modules',    // local node modules
      '../node_modules', // global node modules
      '../eth/types'
    ],
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        include: [
          path.resolve(__dirname, '../node_modules/quill-2.0-dev/assets/icons'),
        ],
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
      {
        // ignore ".spec.ts" test files in build
        test: /^(?!.*\.spec\.ts$).*(?:\.ts)$/,
        include: [
          path.resolve(__dirname, '../client'),
          path.resolve(__dirname, '../shared'),
          path.resolve(__dirname, '../eth/types'),
        ],
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.(js)$/,
        include: [
          path.resolve(__dirname, '../client'),
          path.resolve(__dirname, '../shared')
        ],
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        exclude: [
          path.resolve(__dirname, '../node_modules/quill-2.0-dev/assets/icons'),
        ],
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]'
          }
        }
      },
    ]
  }
};
