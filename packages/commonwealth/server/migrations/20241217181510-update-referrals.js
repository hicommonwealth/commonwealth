'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('ReferralFees', {
        eth_chain_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        transaction_hash: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        namespace_address: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        distributed_token_address: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        referrer_recipient_address: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        referrer_received_eth_amount: {
          type: Sequelize.DOUBLE,
          allowNull: false,
        },
      });
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
