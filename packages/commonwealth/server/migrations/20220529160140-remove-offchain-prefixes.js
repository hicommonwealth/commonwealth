'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove offchain prefixes from all database tables
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('OffchainReactions', 'Reactions', {
        transaction,
      });
      await queryInterface.renameTable('OffchainViewCounts', 'ViewCounts', {
        transaction,
      });
      await queryInterface.renameTable('OffchainTopics', 'Topics', {
        transaction,
      });
      await queryInterface.renameTable('OffchainVotes', 'Votes', {
        transaction,
      });
      await queryInterface.renameTable('OffchainPolls', 'Polls', {
        transaction,
      });
      await queryInterface.renameTable('OffchainAttachments', 'Attachments', {
        transaction,
      });
      await queryInterface.renameTable('OffchainComments', 'Comments', {
        transaction,
      });
      await queryInterface.renameTable('OffchainThreads', 'Threads', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Collaborations',
        'offchain_thread_id',
        'thread_id',
        { transaction }
      );
      await queryInterface.addIndex(
        'Subscriptions',
        { fields: ['offchain_thread_id'] },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add offchain prefixes
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Reactions', 'OffchainReactions', {
        transaction,
      });
      await queryInterface.renameTable('ViewCounts', 'OffchainViewCounts', {
        transaction,
      });
      await queryInterface.renameTable('Topics', 'OffchainTopics', {
        transaction,
      });
      await queryInterface.renameTable('Votes', 'OffchainVotes', {
        transaction,
      });
      await queryInterface.renameTable('Polls', 'OffchainPolls', {
        transaction,
      });
      await queryInterface.renameTable('Attachments', 'OffchainAttachments', {
        transaction,
      });
      await queryInterface.renameTable('Comments', 'OffchainComments', {
        transaction,
      });
      await queryInterface.renameTable('Threads', 'OffchainThreads', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Collaborations',
        'thread_id',
        'offchain_thread_id',
        { transaction }
      );
      await queryInterface.removeIndex(
        'Subscriptions',
        { fields: ['offchain_thread_id'] },
        { transaction }
      );
    });
  },
};
