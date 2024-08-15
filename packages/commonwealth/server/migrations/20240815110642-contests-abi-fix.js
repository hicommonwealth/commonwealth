'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Get old namespace factory ABI
      const [oldResult] = await queryInterface.sequelize.query(
        `
          SELECT id FROM "ContractAbis" WHERE nickname = 'NamespaceFactory'
        `,
      );
      const oldContractAbiId = oldResult[0]?.id;
      if (!oldContractAbiId) {
        throw new Error('Failed to get old contract ABI ID');
      }

      // Get new namespace factory ABI
      const [newResult] = await queryInterface.sequelize.query(
        `
          SELECT id FROM "ContractAbis" WHERE nickname = 'NamespaceFactoryForContests'
        `,
      );
      const contractAbiId = newResult[0]?.id;
      if (!contractAbiId) {
        throw new Error('Failed to get new contract ABI ID');
      }

      // Update old EVM event sources to use new namespace factory ABI
      await queryInterface.sequelize.query(
        `
        UPDATE "EvmEventSources"
        SET abi_id = :contractAbiId
        WHERE abi_id = :oldContractAbiId
        `,
        {
          replacements: { contractAbiId, oldContractAbiId },
          transaction,
        },
      );

      // Delete old ABI
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContractAbis" WHERE nickname = 'NamespaceFactory'
        `,
        { transaction },
      );

      // Rename new ABI to old name
      await queryInterface.sequelize.query(
        `
        UPDATE "ContractAbis" SET nickname = 'NamespaceFactory' WHERE nickname = 'NamespaceFactoryForContests'
        `,
        { transaction },
      );
    });
  },

  // Migration not reversible
  async down(queryInterface, Sequelize) {
    // This migration is not reversible. If you need to reverse it, please handle it manually.
  },
};
