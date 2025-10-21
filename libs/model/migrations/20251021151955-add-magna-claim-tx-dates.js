'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claim_tx_at timestamptz;
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_claim_tx_finalized boolean;
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_cliff_claim_tx_at timestamptz;
      ALTER TABLE "ClaimAddresses" ADD COLUMN magna_cliff_claim_tx_finalized boolean;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claim_tx_at;
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_claim_tx_finalized;
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_cliff_claim_tx_at;
      ALTER TABLE "ClaimAddresses" DROP COLUMN magna_cliff_claim_tx_finalized;
    `);
  },
};
