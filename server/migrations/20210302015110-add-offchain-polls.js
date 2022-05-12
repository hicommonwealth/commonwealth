module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .transaction(async (t) => {
        await queryInterface.createTable(
          'OffchainVotes',
          {
            id: {
              type: Sequelize.INTEGER,
              autoIncrement: true,
              primaryKey: true,
            },
            thread_id: { type: Sequelize.INTEGER, allowNull: false },
            option: { type: Sequelize.STRING, allowNull: false },
            address: { type: Sequelize.STRING, allowNull: false },
            author_chain: { type: Sequelize.STRING, allowNull: true },
            chain: { type: Sequelize.STRING, allowNull: true },
            community: { type: Sequelize.STRING, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
          },
          { transaction: t }
        );

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
          await queryInterface.addIndex(
            'OffchainThreads',
            { fields: ['community', 'offchain_voting_ends_at'] },
            { transaction: t }
          );
          await queryInterface.addIndex(
            'OffchainThreads',
            { fields: ['community', 'offchain_voting_votes'] },
            { transaction: t }
          );
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain_offchain_voting_ends_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community_offchain_voting_ends_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain_offchain_voting_votes',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community_offchain_voting_votes',
        { transaction: t }
      );

      await queryInterface.removeColumn(
        'OffchainThreads',
        'offchain_voting_ends_at',
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainThreads',
        'offchain_voting_votes',
        { transaction: t }
      );

      await queryInterface.dropTable('OffchainVotes', { transaction: t });
    });
  },
};
