// Replace your-framework with the framework you are using (e.g., react-webpack5, vue3-webpack5)
/** @type { import('@storybook/react-webpack5').StorybookConfig } */
// import type { StorybookConfig } from '@storybook/react';
import type { StorybookConfig } from '@storybook/react-webpack5';
const path = require('path');

const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

// module.exports = {
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  babel: async (options) => ({
    ...options,
    plugins: [...options.plugins, '@babel/plugin-transform-react-jsx'],
  }),
};

export default config;
