module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainThreads',
        'offchain_voting_ends_at'
      );
      await queryInterface.removeColumn(
        'OffchainThreads',
        'offchain_voting_votes'
      );
      await queryInterface.removeColumn(
        'OffchainThreads',
        'offchain_voting_options'
      );
      await queryInterface.renameColumn(
        'OffchainThreads',
        'offchain_voting_enabled',
        'has_poll'
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .transaction(async (t) => {
        await queryInterface.addColumn(
          'OffchainThreads',
          'offchain_voting_ends_at',
          { type: Sequelize.DATE, allowNull: true },
          { transaction: t }
        );
        await queryInterface.addColumn(
          'OffchainThreads',
          'offchain_voting_votes',
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction: t }
        );
      })
      .then(async () => {
        queryInterface.renameColumn(
          'OffchainThreads',
          'has_poll',
          'offchain_voting_enabled'
        );
      })
      .then(async () => {
        await queryInterface.sequelize.transaction(async (t) => {
          await queryInterface.addIndex(
            'OffchainThreads',
            { fields: ['chain', 'offchain_voting_ends_at'] },
            { transaction: t }
          );
          await queryInterface.addIndex(
            'OffchainThreads',
            { fields: ['chain', 'offchain_voting_votes'] },
            { transaction: t }
          );
        });
      });
  },
};
