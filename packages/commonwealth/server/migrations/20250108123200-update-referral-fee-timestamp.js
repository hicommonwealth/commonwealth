'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referrals" ALTER COLUMN "created_on_chain_timestamp" TYPE BIGINT;
        ALTER TABLE "ReferralFees" ALTER COLUMN "transaction_timestamp" TYPE BIGINT;
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
