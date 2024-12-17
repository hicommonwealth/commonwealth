'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ReferralFees',
        {
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
            type: Sequelize.FLOAT,
            allowNull: false,
          },
          transaction_timestamp: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users',
        'referral_eth_earnings',
        {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'Referrals',
        {
          eth_chain_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          transaction_hash: {
            type: Sequelize.STRING,
            primaryKey: true,
          },
          referee_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          referrer_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          referrer_received_eth_amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
            defaultValue: 0,
          },
          referral_created_timestamp: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ReferralFees', { transaction });
      await queryInterface.removeColumn('Users', 'referral_eth_earnings', {
        transaction,
      });
    });
  },
};
