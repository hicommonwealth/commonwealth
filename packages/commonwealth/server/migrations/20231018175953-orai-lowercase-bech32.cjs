'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "Chains"
      SET bech32_prefix = 'orai', default_symbol = 'ORAI'
      WHERE id = 'oraichain';
      UPDATE "Chains" SET bech32_prefix = 'odin' WHERE bech32_prefix = 'ODIN';
      UPDATE "Chains" SET bech32_prefix = 'dym' WHERE bech32_prefix = 'DYM';

      ALTER TABLE "Chains"
      ADD CONSTRAINT "check_lowercase_bech32_prefix" CHECK (bech32_prefix = LOWER(bech32_prefix));
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      ALTER TABLE "Chains"
      DROP CONSTRAINT "check_lowercase_bech32_prefix";

      UPDATE "Chains"
      SET bech32_prefix = 'Orai', default_symbol = 'Orai'
      WHERE id = 'oraichain';
      UPDATE "Chains" SET bech32_prefix = 'ODIN' WHERE bech32_prefix = 'odin';
      UPDATE "Chains" SET bech32_prefix = 'DYM' WHERE bech32_prefix = 'dym';
      `,
      { raw: true }
    );
  },
};
