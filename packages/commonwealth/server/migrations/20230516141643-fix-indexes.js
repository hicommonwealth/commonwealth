'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'Comments',
        'offchain_comments_address_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'Comments',
        'offchain_commnets_chain_object_id',
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
