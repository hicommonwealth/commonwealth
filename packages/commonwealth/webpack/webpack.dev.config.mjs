import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import baseConfig from './webpack.base.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const devConfig = merge(baseConfig, {
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
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
  },
  devServer: {
    inline: true,
    hot: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({ minimizerOptions: { preset: ['default'] } }),
    ],
  },
});

export default merge(devConfig, {
  entry: {
    app: ['webpack-hot-middleware/client?path=/__webpack_hmr&reload=true'],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // used for hot reloading
  ],
});
