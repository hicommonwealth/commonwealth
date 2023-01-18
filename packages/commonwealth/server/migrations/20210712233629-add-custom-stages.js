'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainCommunities',
        'additionalStages',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainCommunities',
        'stagesEnabled',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'additionalStages',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'stagesEnabled',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'additionalStages',
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'stagesEnabled',
        { transaction: t }
      );
      await queryInterface.removeColumn('Chains', 'additionalStages', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'stagesEnabled', {
        transaction: t,
      });
    });
  },
};
