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
          referrer_received_amount: {
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
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          eth_chain_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          transaction_hash: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          namespace_address: {
            type: Sequelize.STRING,
            allowNull: true,
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
          created_on_chain_timestamp: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          created_off_chain_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'Referrals',
        ['eth_chain_id', 'transaction_hash'],
        {
          unique: true,
          transaction,
        },
      );

      await queryInterface.addIndex('Referrals', ['referee_address'], {
        transaction,
      });
      await queryInterface.addIndex('Referrals', ['referrer_address'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ReferralFees', { transaction });
      await queryInterface.dropTable('Referrals', { transaction });
      await queryInterface.removeColumn('Users', 'referral_eth_earnings', {
        transaction,
      });
    });
  },
};
