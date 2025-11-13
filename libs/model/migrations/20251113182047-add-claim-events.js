'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // create claim events table
      await queryInterface.createTable(
        'ClaimEvents',
        {
          id: {
            type: Sequelize.STRING,
            primaryKey: true,
          },
          description: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          contract_id: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          contract_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          token: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          token_id: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          token_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          unlock_schedule_id: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          unlock_start_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          initial_percentage: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          cliff_date: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          end_registration_date: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      // seed airdrops
      await queryInterface.bulkInsert(
        'ClaimEvents',
        [
          {
            id: 'common-airdrop',
            description: 'COMMON Initial Retrodrop',
            contract_id: '713ff18f-40a1-44bd-82e0-4fa876b8db48',
            contract_address: '0x45Bd2f58008b7D0942E36E6827A037eef60AF7D6',
            token: 'COMMON',
            token_id: 'da83743a-75d9-434c-9f73-bc1c76fd60ff',
            token_address: '0x4c87da04887a1F9F21F777E3A8dD55C3C9f84701',
            unlock_schedule_id: '47610c8d-863c-4ada-a660-437621491ea6',
            unlock_start_at: new Date('2025-10-27T13:00:00Z'),
            initial_percentage: 0.33,
            cliff_date: new Date('2026-04-27T13:00:00Z'),
            end_registration_date: new Date('2025-11-30'),
          },
          {
            id: 'common-adjauradrop',
            description: 'COMMON Adjusted Aura Drop',
            contract_id: '713ff18f-40a1-44bd-82e0-4fa876b8db48',
            contract_address: '0x45Bd2f58008b7D0942E36E6827A037eef60AF7D6',
            token: 'COMMON',
            token_id: 'da83743a-75d9-434c-9f73-bc1c76fd60ff',
            token_address: '0x4c87da04887a1F9F21F777E3A8dD55C3C9f84701',
            unlock_schedule_id: '1dcd65b7-fdb8-464d-b7e8-0053216d8c59',
            unlock_start_at: new Date('2025-10-27T13:00:00Z'),
            initial_percentage: 0.33,
            cliff_date: new Date('2026-04-27T13:00:00Z'),
            end_registration_date: new Date('2025-12-31'),
          },
        ],
        { transaction },
      );

      // remove primary key constraint on claim addresses
      await queryInterface.removeConstraint(
        'ClaimAddresses',
        'ClaimAddresses_pkey',
        { transaction },
      );

      // add event_id column to ClaimAddresses and and seed with first airdrop id
      await queryInterface.addColumn(
        'ClaimAddresses',
        'event_id',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'common-airdrop',
        },
        { transaction },
      );

      // add primary key constraint on claim addresses
      await queryInterface.addConstraint('ClaimAddresses', {
        fields: ['event_id', 'user_id'],
        type: 'PRIMARY KEY',
        name: 'ClaimAddresses_pkey',
        transaction,
      });

      // recreate unique contraint on claim addresses using event id and address
      await queryInterface.removeConstraint(
        'ClaimAddresses',
        'claimaddresses_address_unique',
        { transaction },
      );
      await queryInterface.addConstraint('ClaimAddresses', {
        fields: ['event_id', 'address'],
        type: 'UNIQUE',
        name: 'claimaddresses_address_unique',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // restore unique constraint on claim addresses
      await queryInterface.removeConstraint(
        'ClaimAddresses',
        'claimaddresses_address_unique',
        { transaction },
      );
      await queryInterface.addConstraint('ClaimAddresses', {
        fields: ['address'],
        type: 'UNIQUE',
        name: 'claimaddresses_address_unique',
        transaction,
      });

      // remove primary key constraint on claim addresses
      await queryInterface.removeConstraint(
        'ClaimAddresses',
        'ClaimAddresses_pkey',
        { transaction },
      );

      // remove event_id column
      await queryInterface.removeColumn('ClaimAddresses', 'event_id', {
        transaction,
      });

      // add primary key constraint on claim addresses
      await queryInterface.addConstraint('ClaimAddresses', {
        fields: ['user_id'],
        type: 'PRIMARY KEY',
        name: 'ClaimAddresses_pkey',
        transaction,
      });

      // drop claim events table
      await queryInterface.dropTable('ClaimEvents', { transaction }); // drop table
    });
  },
};
