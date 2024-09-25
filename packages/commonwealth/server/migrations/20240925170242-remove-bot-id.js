'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DiscordBotConfig', 'bot_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('DiscordBotConfig', 'bot_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
