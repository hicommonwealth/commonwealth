'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Threads"
      ALTER COLUMN "body" SET NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
        ALTER TABLE "Threads"
        ALTER COLUMN "body" DROP NOT NULL;
    `);
  },
};
