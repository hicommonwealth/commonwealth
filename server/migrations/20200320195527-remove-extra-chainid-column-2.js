'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Addresses', 'chain_id');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Addresses', 'chain_id', {
      type: Sequelize.STRING,
      references: { model: 'Chains', key: 'id' },
    });
  },
};
