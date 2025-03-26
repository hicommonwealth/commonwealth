'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Communities', 'discord_config_id', {
        transaction,
      });
      await queryInterface.removeConstraint(
        'DiscordBotConfig',
        'DiscordBotConfig_pkey',
        { transaction },
      );
      await queryInterface.removeColumn('DiscordBotConfig', 'id', {
        transaction,
      });
      await queryInterface.addConstraint('DiscordBotConfig', {
        fields: ['community_id'],
        type: 'primary key',
        name: 'DiscordBotConfig_pkey',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'DiscordBotConfig',
        'DiscordBotConfig_pkey',
        { transaction },
      );
      await queryInterface.addColumn(
        'DiscordBotConfig',
        'id',
        {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Communities',
        'discord_config_id',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'DiscordBotConfig',
            key: 'id',
          },
        },
        { transaction },
      );
    });
  },
};
