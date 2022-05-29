'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove offchain prefixes from all database tables

    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainReactions_id_seq"
        RENAME TO "Reactions_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable("OffchainReactions", "Reactions", { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainViewCounts_id_seq"
        RENAME TO "ViewCounts_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainViewCounts', 'ViewCounts', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainTopics_id_seq"
        RENAME TO "Topics_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainTopics', 'Topics', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainVotes_id_seq"
        RENAME TO "Votes_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainVotes', 'Votes', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainPolls_id_seq"
        RENAME TO "Polls_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainPolls', 'Polls', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainAttachments_id_seq"
        RENAME TO "Attachments_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainAttachments', 'Attachments', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainComments_id_seq"
        RENAME TO "Comments_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainComments', 'Comments', { transaction });

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "OffchainThreads_id_seq"
        RENAME TO "Threads_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
      await queryInterface.renameTable('OffchainThreads', 'Threads', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add offchain prefixes

    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable("Reactions", "OffchainReactions", { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Reactions_id_seq"
        RENAME TO "OffchainReactions_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('ViewCounts', 'OffchainViewCounts', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "ViewCounts_id_seq"
        RENAME TO "OffchainViewCounts_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Topics', 'OffchainTopics', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Topics_id_seq"
        RENAME TO "OffchainTopics_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Votes', 'OffchainVotes', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Votes_id_seq"
        RENAME TO "OffchainVotes_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Polls', 'OffchainPolls', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Polls_id_seq"
        RENAME TO "OffchainPolls_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Attachments', 'OffchainAttachments', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Attachments_id_seq"
        RENAME TO "OffchainAttachments_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Comments', 'OffchainComments', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Comments_id_seq"
        RENAME TO "OffchainComments_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );

      await queryInterface.renameTable('Threads', 'OffchainThreadss', { transaction });
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Threads_id_seq"
        RENAME TO "OffchainThreads_id_seq"`,
        {
          type: Sequelize.RAW,
          raw: true,
          transaction,
        },
      );
    });
  }
};
