/** @type {import('dependency-cruiser').IConfiguration} */
const baseConfig = require('./.dependency-cruiser.cjs');

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. Refactor to remove cycles before EPIC-6 cleanup hardening.',
      from: {
        path: '^packages/commonwealth/client/scripts',
      },
      to: {
        circular: true,
      },
    },
  ],
  options: {
    ...baseConfig.options,
    includeOnly: '^packages/commonwealth/client/scripts',
  },
};
