'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // data will be populated later, via `pnpm run migrate-identities`.
      await queryInterface.addColumn(
        'OffchainProfiles',
        'identity',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'OffchainProfiles',
        'judgements',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainProfiles', 'identity', {
        transaction: t,
      });
      await queryInterface.removeColumn('OffchainProfiles', 'judgements', {
        transaction: t,
      });
    });
  },
};
