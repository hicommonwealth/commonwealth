'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('OffchainTags', 'OffchainTopics', {
        transaction: t,
      });
      await queryInterface.renameColumn('DiscussionDrafts', 'tag', 'topic', {
        transaction: t,
      });
      await queryInterface.renameColumn(
        'OffchainThreads',
        'tag_id',
        'topic_id',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'featured_tags',
        'featured_topics',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'featured_tags',
        'featured_topics',
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('OffchainTopics', 'OffchainTags', {
        transaction: t,
      });
      await queryInterface.renameColumn('DiscussionDrafts', 'topic', 'tag', {
        transaction: t,
      });
      await queryInterface.renameColumn(
        'OffchainThreads',
        'topic_id',
        'tag_id',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Chains',
        'featured_topics',
        'featured_tags',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'featured_topics',
        'featured_tags',
        { transaction: t }
      );
    });
  },
};
