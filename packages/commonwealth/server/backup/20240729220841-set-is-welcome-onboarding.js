'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET is_welcome_onboard_flow_complete = true
      WHERE profile ->> 'name' != 'Anonymous' AND profile ->> 'name' IS NOT NULL;
    `);
  },

  // not reversible
  async down(queryInterface, Sequelize) {},
};
