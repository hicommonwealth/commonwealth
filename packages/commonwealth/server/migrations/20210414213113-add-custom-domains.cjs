'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainCommunities',
        'customDomain',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'customDomain',
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
        'customDomain',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'Chains',
        'customDomain',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },
};
