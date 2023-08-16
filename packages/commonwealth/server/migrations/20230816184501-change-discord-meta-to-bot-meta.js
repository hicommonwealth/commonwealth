'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Rename the column
      await queryInterface.renameColumn('Threads', 'discord_meta', 'bot_meta', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Comments',
        'discord_meta',
        'bot_meta',
        { transaction }
      );

      // 2. Update the content using PostgreSQL's JSON functions
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET bot_meta = bot_meta::jsonb || '{"bot_type": "discord"}'::jsonb 
        WHERE bot_meta IS NOT NULL
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Comments"
        SET bot_meta = bot_meta::jsonb || '{"bot_type": "discord"}'::jsonb 
        WHERE bot_meta IS NOT NULL
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Revert the column name
      await queryInterface.renameColumn('Threads', 'bot_meta', 'discord_meta', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Comments',
        'bot_meta',
        'discord_meta',
        { transaction }
      );

      // 2. Remove the bot_type key from the JSON using PostgreSQL's JSON functions
      await queryInterface.sequelize.query(
        `
      UPDATE "Threads" 
      SET discord_meta = discord_meta::jsonb - 'bot_type' 
      WHERE discord_meta IS NOT NULL
    `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
      UPDATE "Comments" 
      SET discord_meta = discord_meta::jsonb - 'bot_type' 
      WHERE discord_meta IS NOT NULL
    `,
        { transaction }
      );
    });
  },
};
