'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainNodes',
        'health',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainNodes', 'health', {
        transaction: t,
      });
    });
  },
};
