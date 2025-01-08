'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      Sequelize.models.ReferralFee.update(
        { transaction_timestamp: Sequelize.BIGINT },
        { transaction },
      );
      Sequelize.models.Referrals.update(
        { created_on_chain_timestamp: Sequelize.BIGINT },
        { transaction },
      );
    });
  },

  async down() {},
};
