'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE
      FROM "ApiKeys"
        USING "Users"
      WHERE "ApiKeys".user_id = "Users".id
        AND "Users".tier < 3
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: Cannot restore deleted API keys as the data is permanently removed
  },
};
