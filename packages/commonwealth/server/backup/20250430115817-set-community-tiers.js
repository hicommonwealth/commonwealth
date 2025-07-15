'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Communities"
      SET "tier" = 3
      WHERE "namespace" IS NOT NULL AND "namespace_address" IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // irreversible
  },
};
