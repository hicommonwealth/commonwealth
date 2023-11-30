'use strict';

const { hasher } = require('node-object-hash');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove abi unique index and use hash index instead
      console.log('Removing old abi index and setting up for the new one');
      await queryInterface.removeConstraint(
        'ContractAbis',
        'ContractAbis_abi_key',
        { transaction }
      );
      await queryInterface.addColumn(
        'ContractAbis',
        'abi_hash',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction }
      );
      console.log('New abi_hash column setup');

      const abis = await queryInterface.sequelize.query(
        `
        SELECT id, abi FROM "ContractAbis";
      `,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      if (abis.length > 0) {
        const hashInstance = hasher({
          coerce: true,
          sort: true,
          trim: true,
          alg: 'sha256',
          enc: 'hex',
        });

        for (const abi of abis) {
          console.log('Updating abi hash for abi id', abi.id);
          let dataToHash;
          if (typeof abi.abi === 'string') {
            dataToHash = JSON.parse(abi.abi);
          } else {
            dataToHash = abi.abi;
          }
          console.log('> hashing');
          const hash = hashInstance.hash(dataToHash);
          console.log('Hash:', hash);
          await queryInterface.sequelize.query(
            `
            UPDATE "ContractAbis" SET abi = ?, abi_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
          `,
            {
              transaction,
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              replacements: [JSON.stringify(dataToHash), hash, abi.id],
            }
          );
          console.log('Updated abi hash for abi id', abi.id);
        }
      }

      await queryInterface.addConstraint('ContractAbis', {
        fields: ['abi_hash'],
        type: 'unique',
        name: 'ContractAbis_abi_hash_key',
        transaction,
      });

      console.log('Setting abi_hash column to NOT NULL');
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ContractAbis" ALTER COLUMN abi_hash SET NOT NULL;
      `,
        { transaction }
      );

      console.log('Adding abi array constraint');
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ContractAbis" ADD CONSTRAINT chk_contract_abi_array CHECK (jsonb_typeof(abi) = 'array');
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('ContractAbis', 'abi_hash', {
        transaction,
      });

      await queryInterface.addConstraint('ContractAbis', {
        fields: ['abi'],
        type: 'unique',
        name: 'ContractAbis_abi_key',
        transaction,
      });
    });
  },
};
