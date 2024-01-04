'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Reactions', 'chain', 'community_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "OffchainReactions_pkey" RENAME TO "Reactions_pkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Reactions" RENAME CONSTRAINT "OffchainReactions_comment_id_fkey" TO "reactions_comment_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Reactions" RENAME CONSTRAINT "OffchainReactions_thread_id_fkey" TO "reactions_thread_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_address_id" RENAME TO "reactions_address_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_chain_comment_id" RENAME TO "reactions_community_id_comment_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_chain_thread_id" RENAME TO "reactions_community_id_thread_id";
      `,
        { transaction },
      );

      // remove index already covered by primary key index
      await queryInterface.removeIndex('Reactions', 'offchain_reactions_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_chain_address_id_thread_id_proposal_id_comme" RENAME TO "reactions_unique";
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Reactions', 'community_id', 'chain', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "Reactions_pkey" RENAME TO "OffchainReactions_pkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Reactions" RENAME CONSTRAINT "reactions_comment_id_fkey" TO "OffchainReactions_comment_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Reactions" RENAME CONSTRAINT "reactions_thread_id_fkey" TO "OffchainReactions_thread_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "reactions_address_id" RENAME TO "offchain_reactions_address_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "reactions_community_id_comment_id" RENAME TO "offchain_reactions_chain_comment_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "reactions_community_id_thread_id" RENAME TO "offchain_reactions_chain_thread_id";
      `,
        { transaction },
      );

      await queryInterface.addIndex('Reactions', {
        fields: ['id'],
        name: 'offchain_reactions_id',
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER INDEX "reactions_unique" RENAME TO "offchain_reactions_chain_address_id_thread_id_proposal_id_comme";
      `,
        { transaction },
      );
    });
  },
};
