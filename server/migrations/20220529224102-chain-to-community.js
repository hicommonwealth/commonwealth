'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Addresses
      await queryInterface.renameColumn('Addresses', 'chain', 'community_id', { transaction });

      // CommunityCategoryTypes
      await queryInterface.renameTable('ChainCategoryTypes', 'CommunityCategoryTypes', { transaction });

      // Chain Categories
      await queryInterface.renameTable('ChainCategories', 'CommunityCategories', { transaction });
      await queryInterface.renameColumn('CommunityCategories', 'chain_id', 'community_id', { transaction });

      // ChainEntity
      await queryInterface.renameColumn('ChainEntities', 'chain', 'community_id', { transaction });

      // ChainEventTypes
      await queryInterface.renameColumn('ChainEventTypes', 'chain', 'community_id', { transaction });

      // @JAKE @TODO: REMOVE IF JAKE DID THIS ALREADY
      await queryInterface.renameColumn('ChainNodes', 'chain', 'community_id', { transaction });

      // Chat Channel
      await queryInterface.renameColumn('Comments', 'chain_id', 'community_id', { transaction });

      // Comments
      await queryInterface.renameColumn('Comments', 'chain', 'community_id', { transaction });

      // Contract Item
      await queryInterface.renameColumn('ContractItems', 'chain', 'community_id', { transaction });

      // Discussion Drafts
      await queryInterface.renameColumn('DiscussionDrafts', 'chain', 'community_id', { transaction });

      // Identity Cache
      await queryInterface.renameColumn('IdentityCaches', 'chain', 'community_id', { transaction });

      // Invite Codes
      await queryInterface.renameColumn('InviteCodes', 'chain_id', 'community_id', { transaction });

      // Notificiations
      await queryInterface.renameColumn('Notifications', 'chain_id', 'community_id', { transaction });

      // reactions
      await queryInterface.renameColumn('Reactions', 'chain', 'community_id', { transaction });

      // Roles
      await queryInterface.renameColumn('Roles', 'chain_id', 'community_id', { transaction });

      // Starred Community
      await queryInterface.renameColumn('StarredCommunities', 'chain', 'community_id', { transaction });

      // Subscription
      await queryInterface.renameColumn('Subscriptions', 'chain_id', 'community_id', { transaction });

      // Threads
      await queryInterface.renameColumn('Threads', 'chain', 'community_id', { transaction });

      // Topics
      await queryInterface.renameColumn('Topics', 'chain_id', 'community_id', { transaction });

      // Votes
      await queryInterface.renameColumn('Votes', 'chain_id', 'community_id', { transaction });
      await queryInterface.renameColumn('Votes', 'author_chain', 'author_community', { transaction });

      // Viewcounts
      await queryInterface.renameColumn('ViewCounts', 'chain', 'community_id', { transaction });

      // Poll
      await queryInterface.renameColumn('Polls', 'chain_id', 'community_id', { transaction });

      // Waitlist Registry
      await queryInterface.renameColumn('WaitlistRegistrations', 'chain_id', 'community_id', { transaction });

      // Webhooks
      await queryInterface.renameColumn('Webhooks', 'chain_id', 'community_id', { transaction });

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Addresses', 'community_id', 'chain', { transaction });

      await queryInterface.renameTable('CommunityCategoryTypes', 'ChainCategoryTypes', { transaction });

    });
  }
};
