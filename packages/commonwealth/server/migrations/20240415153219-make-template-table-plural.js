'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameTable('Template', 'Templates');
  },

  down: (queryInterface) => {
    return queryInterface.renameTable('Templates', 'Template');
  },
};
