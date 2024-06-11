'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Memberships" ALTER COLUMN "reject_reason" TYPE VARCHAR(1024);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Memberships" ALTER COLUMN "reject_reason" TYPE VARCHAR(255);
    `);
  }
};
