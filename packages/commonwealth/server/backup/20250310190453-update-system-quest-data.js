'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Quests"
      SET 
      name = 'Welcome to Common',
      description = 'Onboard to Common and gain XP',
      image_url = 'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png',
      end_date = '2100-03-04 20:12:54.738725+05'
      WHERE id = -1;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Not adding a revert for initial system quest
  },
};
