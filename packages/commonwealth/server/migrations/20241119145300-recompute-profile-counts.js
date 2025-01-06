'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
        UPDATE "Communities" C
        SET profile_count = (SELECT COUNT(DISTINCT (user_id)) FROM "Addresses" WHERE community_id = C.id);
    `);
  },

  async down(queryInterface, Sequelize) {},
};
