'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'chain', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'chain', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'edgeware-testnet',
    });
  },
};
