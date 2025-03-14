'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'QuestTweets',
        'retweet_xp_awarded',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'QuestTweets',
        'reply_xp_awarded',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'QuestTweets',
        'like_xp_awarded',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.removeColumn('QuestTweets', 'ended_at', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('QuestTweets', 'retweet_xp_awarded', {
        transaction,
      });
      await queryInterface.removeColumn('QuestTweets', 'reply_xp_awarded', {
        transaction,
      });
      await queryInterface.removeColumn('QuestTweets', 'like_xp_awarded', {
        transaction,
      });
      await queryInterface.addColumn('QuestTweets', 'ended_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    });
  },
};
