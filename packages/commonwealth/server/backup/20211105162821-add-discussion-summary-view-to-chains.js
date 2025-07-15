'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'default_summary_view',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainCommunities',
        'default_summary_view',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Chains',
        'default_summary_view',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'default_summary_view',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },
};
