'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Addresses', 'chain', 'community_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "addresses_public_key_chain" RENAME TO "Addresses_address_community_id";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses"
        RENAME CONSTRAINT "Addresses_chain_fkey" TO "Addresses_community_id_fkey";
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Addresses', 'community_id', 'chain', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "Addresses_address_community_id" RENAME TO "addresses_public_key_chain";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses"
        RENAME CONSTRAINT "Addresses_community_id_fkey" TO "Addresses_chain_fkey";
      `,
        { transaction }
      );
    });
  },
};
