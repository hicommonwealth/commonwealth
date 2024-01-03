'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Comments', 'chain', 'community_id', {
        transaction,
      });
      // these are both indexes on Comments.id which is already covered by the primary key index
      await queryInterface.removeIndex('Comments', 'offchain_comments_id', {
        transaction,
      });
      await queryInterface.removeIndex('Comments', 'comments_id', {
        transaction,
      });

      // unused indexes on (chain, parent_id)
      await queryInterface.removeIndex(
        'Comments',
        'offchain_comments_chain_object_id',
        { transaction },
      );
      // TODO: is this really unused?
      // await queryInterface.removeIndex('Comments', 'comments_chain_object_id', { transaction });

      // duplicate of 'comments_address_id' index on Comments.address_id
      await queryInterface.removeIndex(
        'Comments',
        'offchain_comments_address_id',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER INDEX "OffchainComments_search" RENAME TO "comments_search"
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_comments_chain_created_at" RENAME TO "comments_community_id_created_at"
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "offchain_comments_chain_updated_at" RENAME TO "comments_community_id_updated_at"
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Comments', 'community_id', 'chain', {
        transaction,
      });
    });
  },
};
