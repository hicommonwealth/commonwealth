'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('QuestTweets', {
      tweet_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      tweet_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quest_action_meta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'QuestActionMetas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      retweet_cap: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      like_cap: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      replies_cap: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      num_likes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      num_retweets: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      num_replies: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('QuestTweets');
  },
};
