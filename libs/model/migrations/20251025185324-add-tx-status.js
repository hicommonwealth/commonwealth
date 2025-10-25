'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ClaimAddresses',
        'magna_claim_tx_status',
        {
          type: Sequelize.STRING,
          allowNull: true,
          transaction,
        },
      );
      await queryInterface.addColumn(
        'ClaimAddresses',
        'magna_cliff_claim_tx_status',
        {
          type: Sequelize.STRING,
          allowNull: true,
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ClaimAddresses',
        'magna_claim_tx_status',
        { transaction },
      );
      await queryInterface.removeColumn(
        'ClaimAddresses',
        'magna_cliff_claim_tx_status',
        { transaction },
      );
    });
  },
};
