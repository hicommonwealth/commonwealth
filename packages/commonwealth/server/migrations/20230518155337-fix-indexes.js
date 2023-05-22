'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Comments
      await queryInterface.removeIndex(
        'Comments',
        'offchain_comments_address_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'Comments',
        'offchain_comments_chain_object_id',
        { transaction: t }
      );
      await queryInterface.removeIndex('Comments', 'comments_id', {
        transaction: t,
      });
      await queryInterface.removeIndex('Comments', 'offchain_comments_id', {
        transaction: t,
      });
      await queryInterface.sequelize.query(
        'ALTER INDEX "offchain_comments_chain_created_at" RENAME TO "comments_chain_created_at"',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER INDEX "offchain_comments_chain_updated_at" RENAME TO "comments_chain_updated_at"',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'ALTER INDEX "offchain_comments_root_id" RENAME TO "comments_root_id"',
        { transaction: t }
      );
      await queryInterface.removeColumn('Comments', 'root_id', {
        transaction: t,
      });
      await queryInterface.removeColumn('Comments', '_search', {
        transaction: t,
      });
      await queryInterface.addIndex('Comments', ['canvas_hash'], {
        transaction: t,
      });
      await queryInterface.addIndex('Comments', ['thread_id'], {
        transaction: t,
      });
      await queryInterface.addIndex('Comments', ['chain', 'thread_id'], {
        transaction: t,
      });

      // Reactions
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_address_id" RENAME TO "reactions_address_id";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_chain_comment_id" RENAME TO "reactions_chain_comment_id";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_reactions_chain_thread_id" RENAME TO "reactions_chain_thread_id";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Reactions" RENAME CONSTRAINT "OffchainReactions_comment_id_fkey" TO "Reactions_comment_id_fkey";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Reactions" RENAME CONSTRAINT "OffchainReactions_thread_id_fkey" TO "Reactions_thread_id_fkey";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Reactions" RENAME CONSTRAINT "OffchainReactions_pkey" TO "Reactions_pkey";
      `,
        { transaction: t }
      );
      await queryInterface.removeIndex('Reactions', 'reactions_id', {
        transaction: t,
      });
      await queryInterface.addIndex('Reactions', ['canvas_hash'], {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
