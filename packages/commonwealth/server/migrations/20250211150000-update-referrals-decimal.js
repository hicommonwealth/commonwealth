'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referrals" ALTER COLUMN "referrer_received_eth_amount" TYPE DECIMAL(78, 0);
        ALTER TABLE "ReferralFees" ALTER COLUMN "referrer_received_amount" TYPE DECIMAL(78, 0);
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referrals" ALTER COLUMN "referrer_received_eth_amount" TYPE FLOAT;
        ALTER TABLE "ReferralFees" ALTER COLUMN "referrer_received_amount" TYPE FLOAT;
        `,
        { transaction },
      );
    });
  },
};
