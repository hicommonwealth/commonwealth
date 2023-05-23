'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const renameIndex = async (oldIndexName, newIndexName) => {
        await queryInterface.sequelize.query(
          `
              ALTER INDEX "${oldIndexName}" RENAME TO "${newIndexName}";
          `,
          { transaction: t }
        );
      };

      const renameConstraint = async (tableName, oldName, newName) => {
        await queryInterface.sequelize.query(
          `
              ALTER TABLE "${tableName}"
                  RENAME CONSTRAINT "${oldName}" TO "${newName}";
          `,
          { transaction: t }
        );
      };

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
      await queryInterface.removeIndex('Comments', 'offchain_comments_id', {
        transaction: t,
      });
      await renameIndex(
        'offchain_comments_chain_created_at',
        'comments_chain_created_at'
      );
      await renameIndex(
        'offchain_comments_chain_updated_at',
        'comments_chain_updated_at'
      );

      // Reactions
      // no this index name is not a bug it's just cutoff in the db
      await renameIndex(
        'offchain_reactions_chain_address_id_thread_id_proposal_id_comme',
        'reactions_chain_address_id_thread_id_proposal_id_comment_id'
      );
      await renameIndex(
        'offchain_reactions_address_id',
        'reactions_address_id'
      );
      await renameIndex(
        'offchain_reactions_chain_comment_id',
        'reactions_chain_comment_id'
      );
      await renameIndex(
        'offchain_reactions_chain_thread_id',
        'reactions_chain_thread_id'
      );
      await renameConstraint(
        'Reactions',
        'OffchainReactions_comment_id_fkey',
        'Reactions_comment_id_fkey'
      );
      await renameConstraint(
        'Reactions',
        'OffchainReactions_thread_id_fkey',
        'Reactions_thread_id_fkey'
      );
      await renameConstraint(
        'Reactions',
        'OffchainReactions_pkey',
        'Reactions_pkey'
      );
      await queryInterface.removeIndex('Reactions', 'offchain_reactions_id', {
        transaction: t,
      });

      // Threads
      await renameIndex('offchain_threads_author_id', 'thread_author_id');
      await renameIndex('Threads', 'offchain_threads_chain', 'threads_chain');
      await renameIndex(
        'offchain_threads_chain_created_at',
        'threads_chain_created_at'
      );
      await renameIndex(
        'offchain_threads_chain_pinned',
        'threads_chain_pinned'
      );
      await renameIndex(
        'offchain_threads_chain_updated_at',
        'threads_chain_updated_at'
      );
      await renameIndex('offchain_threads_created_at', 'threads_created_at');
      await renameIndex('offchain_threads_updated_at', 'threads_updated_at');
      await renameIndex('OffchainThreads_search', 'threads_search');
      await renameConstraint('Threads', 'OffchainThreads_pkey', 'Threads_pkey');
      await renameConstraint(
        'Threads',
        'OffchainThreads_author_id_fkey',
        'Threads_author_id_fkey'
      );

      // Topics
      await renameConstraint(
        'Topics',
        'OffchainThreadCategories_pkey',
        'Topics_pkey'
      );
      await renameConstraint(
        'Topics',
        'OffchainTopics_rule_id_fkey',
        'Topics_rule_id_fkey'
      );

      // Votes
      await renameConstraint('Votes', 'OffchainVotes_pkey', 'Votes_pkey');
      await renameConstraint(
        'Votes',
        'OffchainVotes_poll_id_fkey',
        'Votes_poll_id_fkey'
      );
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
