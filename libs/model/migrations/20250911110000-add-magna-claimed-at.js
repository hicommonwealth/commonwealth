'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claimed_at timestamptz;
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claim_data text;
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claim_tx_hash character varying(255);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claimed_at;
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claim_data;
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claim_tx_hash;
    `);
  },
};
