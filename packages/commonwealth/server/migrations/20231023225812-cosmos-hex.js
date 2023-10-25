'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "hex" VARCHAR(64) NULL,
        ADD CONSTRAINT "cosmos_requires_hex"
        CHECK ((wallet_id NOT IN ('keplr', 'cosm-metamask', 'terrastation', 'keplr-ethereum')) OR (wallet_id IN ('keplr', 'cosm-metamask', 'terrastation', 'keplr-ethereum') AND hex IS NOT NULL)) NOT VALID;
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Addresses"
          DROP CONSTRAINT IF EXISTS "cosmos_requires_hex",
          DROP COLUMN "hex";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
