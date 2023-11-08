'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('DiscordBotConfig', 'chain_id', 'community_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "DiscordBotConfig"
        RENAME CONSTRAINT "DiscordBotConfig_chain_id_fkey" TO "DiscordBotConfig_community_id_fkey";
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('DiscordBotConfig', 'community_id', 'chain_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "DiscordBotConfig"
        RENAME CONSTRAINT "DiscordBotConfig_community_id_fkey" TO "DiscordBotConfig_chain_id_fkey";
      `,
        { transaction }
      );
    });
  }
};
