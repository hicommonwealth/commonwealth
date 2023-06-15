import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import devWebpackConfig from '../../webpack/webpack.dev.config';

export default function setupWebpackDevServer(app) {
  // we don't want to require all the webpack dependencies during production
  const compiler = webpack(devWebpackConfig as any);
  const devMiddleware = webpackDevMiddleware(compiler as any, {
    publicPath: '/build',
  });
  app.use(devMiddleware);
  app.use(webpackHotMiddleware(compiler));

  // Development: serve everything through devMiddleware
  app.get('*', (req, res, next) => {
    req.url = '/build/';
    devMiddleware(req, res, next);
  });
}
