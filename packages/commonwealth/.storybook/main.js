// Replace your-framework with the framework you are using (e.g., react-webpack5, vue3-webpack5)
// import type { StorybookConfig } from '@storybook/react-webpack5';

module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  // DO NOT REMOVE THIS FOR THIS STORYBOOK VERSION (7.0.7)
  babel: async (options) => ({
    ...options,
    plugins: [...options.plugins, '@babel/plugin-transform-react-jsx'],
  }),
};
