const fs = require('fs');

exports.default = ({ orig, file }) => {
  if (
    file.endsWith('setupWebpackDevServer.js') ||
    file.endsWith('webpack.dev.config.mjs') ||
    file.endsWith('webpack.base.config.mjs')
  ) {
    if (orig === "from '../webpack'" || orig === "from '../../webpack'") {
      return "from 'webpack'";
    }
  }
  return orig;
};
