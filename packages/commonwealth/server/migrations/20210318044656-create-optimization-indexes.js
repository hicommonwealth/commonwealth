'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['created_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['updated_at'] },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['chain', 'created_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['community', 'created_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['chain', 'updated_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['community', 'updated_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['chain', 'pinned'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainThreads',
        { fields: ['community', 'pinned'] },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'OffchainComments',
        { fields: ['chain', 'created_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainComments',
        { fields: ['community', 'created_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainComments',
        { fields: ['chain', 'updated_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainComments',
        { fields: ['community', 'updated_at'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainComments',
        { fields: ['root_id'] },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'OffchainReactions',
        { fields: ['chain', 'thread_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainReactions',
        { fields: ['community', 'thread_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainReactions',
        { fields: ['chain', 'comment_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'OffchainReactions',
        { fields: ['community', 'comment_id'] },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_created_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_updated_at',
        { transaction: t }
      );

      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain_created_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community_created_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain_updated_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community_updated_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_chain_pinned',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainThreads',
        'offchain_threads_community_pinned',
        { transaction: t }
      );

      await queryInterface.removeIndex(
        'OffchainComments',
        'offchain_comments_chain_created_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainComments',
        'offchain_comments_community_created_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainComments',
        'offchain_comments_chain_updated_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainComments',
        'offchain_comments_community_updated_at',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainComments',
        'offchain_comments_root_id',
        { transaction: t }
      );

      await queryInterface.removeIndex(
        'OffchainReactions',
        'offchain_reactions_chain_thread_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainReactions',
        'offchain_reactions_community_thread_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainReactions',
        'offchain_reactions_chain_comment_id',
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'OffchainReactions',
        'offchain_reactions_community_comment_id',
        { transaction: t }
      );
    });
  },
};
