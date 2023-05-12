/** @type { import('@storybook/react-webpack5').StorybookConfig } */

// Custom Webpack configuration being imported.
import custom from '../webpack/webpack.dev.config';

module.exports = {
  stories: ['./stories/**/*.mdx', './stories/**/*.stories.@(js|jsx|ts|tsx)'],
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
    return {
      ...config,
      output: { ...config.output, pathinfo: true },
      mode: 'development',
      context: __dirname,
      module: {
        ...config.module,
        rules: [...config.module.rules, ...custom.module.rules].filter(
          (rule) => {
            return !rule.use || !rule.use.includes('fast-sass-loader');
          }
        ),
      },
      resolve: {
        ...config.resolve,
        extensions: [...custom.resolve.extensions],
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
        },
      },
    };
  },
  babel: async (options) => ({
    ...options,
    plugins: [...options.plugins, '@babel/plugin-transform-react-jsx'],
  }),
};
