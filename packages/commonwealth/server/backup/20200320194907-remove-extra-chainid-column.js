'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChainNodes', 'chain_id');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChainNodes', 'chain_id', {
      type: Sequelize.STRING,
      references: { model: 'Chains', key: 'id' },
    });
  },
};
