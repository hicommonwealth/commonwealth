'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add column
      await queryInterface.addColumn(
        'Addresses',
        'wallet_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      // populate column for all but default eth addresses
      // update by base
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'phantom'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".base = 'solana'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'near'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".base = 'near'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'polkadot'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".base = 'substrate'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'keplr'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".base = 'cosmos'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );

      // update by network
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'ronin'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".network = 'axie-infinity'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'inj-metamask'
        WHERE chain IN (
          SELECT "Chains".id
          FROM "Chains"
          WHERE "Chains".network = 'injective' OR "Chains".network = 'injective-testnet'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_id = 'terrastation'
        WHERE chain IN (
          SELECT "Chains".id FROM "Chains" WHERE "Chains".network = 'terra'
        );
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );

      // update for magic specifically
      await queryInterface.bulkUpdate(
        'Addresses',
        { wallet_id: 'magic' },
        { is_magic: true },
        { transaction }
      );

      // drop is_magic field (use magic wallet instead)
      await queryInterface.removeColumn('Addresses', 'is_magic', {
        transaction,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Addresses',
        'is_magic',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );

      // repopulate is_magic based on wallet_id === 'magic'
      await queryInterface.bulkUpdate(
        'Addresses',
        { is_magic: true },
        { wallet_id: 'magic' },
        { transaction }
      );

      await queryInterface.removeColumn('Addresses', 'wallet_id', {
        transaction,
      });
    });
  },
};
