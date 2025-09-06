'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claimed_at timestamptz;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claimed_at;
    `);
  },
};
