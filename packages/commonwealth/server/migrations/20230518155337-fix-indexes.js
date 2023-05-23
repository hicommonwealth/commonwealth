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

      // Addresses
      await queryInterface.addIndex('Addresses', ['name'], { transaction: t });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses"
        ALTER COLUMN "ghost_address" SET DEFAULT false,
        ALTER COLUMN "ghost_address" SET NOT NULL;
      `,
        { transaction: t }
      );

      // Bans
      await queryInterface.addIndex('Bans', ['chain_id'], { transaction: t });

      // ChainEntityMeta
      await queryInterface.addIndex('ChainEntityMeta', ['chain'], {
        transaction: t,
      });

      // CommunityRoles -> removed in Kill Role Assignment PR
      // await queryInterface.addIndex('CommunityRoles', ['chain_id'], { transaction: t });

      // ContractAbis
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ContractAbis"
        ALTER COLUMN "abi" SET NOT NULL;
      `,
        { transaction: t }
      );

      // DiscussionDrafts
      await queryInterface.addIndex('DiscussionDrafts', ['address_id'], {
        transaction: t,
      });

      // Notifications
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Notifications"
        ALTER COLUMN "notification_data" SET NOT NULL;
      `,
        { transaction: t }
      );

      // Notifications Read
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead"
        ALTER COLUMN "is_read" SET DEFAULT false;
      `,
        { transaction: t }
      );

      // Polls
      await queryInterface.addIndex('Polls', ['chain_id'], { transaction: t });
      await queryInterface.addIndex('Polls', ['thread_id'], { transaction: t });

      // OldChatMessages
      await queryInterface.dropTable('OldChatMessages', { transaction: t });

      // Profiles
      await queryInterface.addIndex('Profiles', ['user_id'], {
        transaction: t,
      });

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
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "comments_chain_object_id" RENAME TO "comments_chain_parent_id";
      `,
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
      await queryInterface.removeIndex('Reactions', 'offchain_reactions_id', {
        transaction: t,
      });
      await queryInterface.addIndex('Reactions', ['canvas_hash'], {
        transaction: t,
      });

      // Rules
      await queryInterface.addIndex('Rules', ['chain_id'], { transaction: t });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Rules"
        ALTER COLUMN "updated_at" SET NOT NULL;
      `,
        { transaction: t }
      );

      // SocialAccounts
      await queryInterface.removeIndex(
        'SocialAccounts',
        'social_accounts_user_id',
        { transaction: t }
      );
      await queryInterface.removeColumn('SocialAccounts', 'login_token_id', {
        transaction: t,
      });

      // StarredCommunities
      await queryInterface.addIndex('StarredCommunities', ['user_id'], {
        transaction: t,
      });

      // Subscriptions
      await queryInterface.addIndex('Subscriptions', ['subscriber_id'], {
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
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        RENAME CONSTRAINT "OffchainThreads_pkey" TO "Threads_pkey"
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        RENAME CONSTRAINT "OffchainThreads_author_id_fkey" TO "Threads_author_id_fkey"
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        ALTER COLUMN "kind" SET NOT NULL;
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads" 
        ALTER COLUMN "chain" DROP DEFAULT;
      `,
        { transaction: t }
      );

      // Topics
      await queryInterface.addIndex('Topics', ['chain_id'], { transaction: t });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Topics"
        RENAME CONSTRAINT "OffchainThreadCategories_pkey" TO "Topics_pkey";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Topics"
        RENAME CONSTRAINT "OffchainTopics_rule_id_fkey" TO "Topics_rule_id_fkey";
      `,
        { transaction: t }
      );

      // Users
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users"
        ALTER COLUMN "disableRichText" SET DEFAULT false,
        ALTER COLUMN "disableRichText" SET NOT NULL;
      `,
        { transaction: t }
      );

      // Votes
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Votes"
        RENAME CONSTRAINT "OffchainVotes_pkey" TO "Votes_pkey";
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Votes"
        RENAME CONSTRAINT "OffchainVotes_poll_id_fkey" TO "Votes_poll_id_fkey";
      `,
        { transaction: t }
      );
      await queryInterface.addIndex('Votes', ['poll_id'], { transaction: t });

      // Webhooks
      await queryInterface.addIndex('Webhooks', ['chain_id'], {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
