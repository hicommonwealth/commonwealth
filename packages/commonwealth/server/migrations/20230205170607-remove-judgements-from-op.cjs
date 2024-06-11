'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainProfiles', 'judgements', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // data will be populated later, via `yarn migrate-identities`.
      await queryInterface.addColumn(
        'OffchainProfiles',
        'judgements',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },
};
