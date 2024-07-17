module.exports = {
  name: 'eslint-plugin-common',
  version: '1.0.0',
  rules: {
    'no-self-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevents self importing libraries',
          recommended: true,
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const path = context.getFilename();
            const lib = path.match(/\/libs\/(.*?)\/src\//);
            if (lib) {
              const selfimport = `@hicommonwealth/${lib[1]}`;
              if (selfimport === node.source.value)
                context.report({
                  node,
                  message: `Avoid self importing '${node.source.value}'`,
                });
            }
          },
        };
      },
    },

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
