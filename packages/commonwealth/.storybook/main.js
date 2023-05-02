/** @type { import('@storybook/react-webpack5').StorybookConfig } */

const path = require('path');

// Custom Webpack configuration being imported.
// import custom from '../webpack/webpack.base.config.js';
import custom from '../webpack/webpack.dev.config';

module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-styling',
      options: {
        sass: {
          // Require your Sass preprocessor here
          implementation: require('sass'),
        },
      },
    },
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: async (config, { configType }) => {
    // console.log(
    //   'path:',
    //   path.resolve(__dirname, '..', 'client', 'scripts', 'views')
    //   // path.resolve('..', 'client', 'scripts', 'views')
    // );
    // C:\dev\common\commonwealth\packages\client\scripts\views

    const configObj = {
      ...config,
      output: { ...config.output, pathinfo: true },
      mode: 'development',
      context: __dirname,
      module: {
        ...config.module,
        rules: [...config.module.rules, ...custom.module.rules].filter((rule) => {
          return !rule.use || !rule.use.includes('fast-sass-loader');
        }),
      },
      resolve: {
        ...config.resolve,
        // ...custom.resolve,
        extensions: [...custom.resolve.extensions],
        // modules: [
        //   '../client/scripts',
        //   '../client/styles',
        //   '../shared',
        //   'node_modules', // local node modules
        //   '../node_modules', // global node modules
        // ],
        modules: [...custom.resolve.modules],
        alias: { ...custom.resolve.alias },
        fallback: {
          fs: false,
          net: false,
          zlib: require.resolve('browserify-zlib'),
          crypto: require.resolve('crypto-browserify'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          os: require.resolve('os-browserify/browser'),
          vm: require.resolve('vm-browserify'),
          path: require.resolve('path-browserify'),
          stream: require.resolve('stream-browserify'),
        }
        // alias: {
        //   components: path.resolve(__dirname, '..', 'client', 'styles'),
        // },
      },
    };



    // console.log('configObj:', configObj.resolve);

    // Make whatever fine-grained changes you need
    return configObj;

    // C:\dev\common\commonwealth\packages\commonwealth\client\scripts\views
    // __dirname = C:\dev\common\commonwealth\packages\commonwealth\.storybook
    // config.resolve.alias = {
    //   'components/component_kit/': path.resolve(
    //     __dirname,
    //     '..',
    //     'client',
    //     'scripts',
    //     'views'
    //   ),
    // };

    // Return the altered config
    return config;
  },
};
// export default config;
