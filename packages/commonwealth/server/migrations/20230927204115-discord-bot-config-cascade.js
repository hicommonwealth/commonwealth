'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Drop the old foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE "DiscordBotConfig" DROP CONSTRAINT "DiscordBotConfig_chain_id_fkey"`,
        { transaction: t }
      );

      // Add the new foreign key constraint with onDelete: 'CASCADE'
      await queryInterface.sequelize.query(
        `ALTER TABLE "DiscordBotConfig" ADD CONSTRAINT "DiscordBotConfig_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "Chains" ("id") ON DELETE CASCADE`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Drop the new foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE "DiscordBotConfig" DROP CONSTRAINT "DiscordBotConfig_chain_id_fkey"`,
        { transaction: t }
      );

      // Add the old foreign key constraint without onDelete: 'CASCADE'
      await queryInterface.sequelize.query(
        `ALTER TABLE "DiscordBotConfig" ADD CONSTRAINT "DiscordBotConfig_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "Chains" ("id")`,
        { transaction: t }
      );
    });
  },
};
