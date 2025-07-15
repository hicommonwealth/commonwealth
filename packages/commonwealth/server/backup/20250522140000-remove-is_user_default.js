'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn('Addresses', 'is_user_default');
  },

  down: () => {},
};
