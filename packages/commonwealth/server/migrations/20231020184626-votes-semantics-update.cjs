'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Votes', 'chain_id', 'community_id', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Votes',
        'author_chain',
        'author_community_id',
        {
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "OffchainVotes_pkey" RENAME TO "Votes_pkey";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Votes"
        RENAME CONSTRAINT "OffchainVotes_poll_id_fkey" TO "Votes_poll_id_fkey";
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Votes', 'community_id', 'chain_id', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Votes',
        'author_community_id',
        'chain_id',
        {
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "Votes_pkey" RENAME TO "OffchainVotes_pkey";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Votes"
        RENAME CONSTRAINT "Votes_poll_id_fkey" TO "OffchainVotes_poll_id_fkey";
      `,
        { transaction }
      );
    });
  },
};
