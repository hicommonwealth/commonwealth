'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "QuestActionMetas"
      SET event_name = 'DiscordServerJoined'
      WHERE event_name = 'CommonDiscordServerJoined'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "QuestActionMetas"
      SET event_name = 'CommonDiscordServerJoined'
      WHERE event_name = 'DiscordServerJoined'
    `);
  },
};
