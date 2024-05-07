module.exports = {
  name: 'eslint-plugin-common',
  version: '1.0.0',
  rules: {
    'no-server-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevents importing server libraries',
          recommended: true,
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            if (
              [
                '@hicommonwealth/adapters',
                '@hicommonwealth/core',
                '@hicommonwealth/eslint-plugin',
                '@hicommonwealth/evm-testing',
                '@hicommonwealth/logging',
                '@hicommonwealth/model',
                '@hicommonwealth/sitemaps',
              ].includes(node.source.value)
            ) {
              context.report({
                node,
                message: `Avoid importing '${node.source.value}' within the client folder`,
              });
            }
          },
        };
      },
    },
  },
};
