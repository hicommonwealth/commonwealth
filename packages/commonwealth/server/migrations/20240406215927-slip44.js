'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainNodes',
        'slip44',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        {
          transaction: t,
        },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 60 WHERE "cosmos_chain_id" IN (
          'acrechain',
          'aioz',
          'canto',
          'conscious',
          'cronos',
          'dymension',
          'echelon',
          'evmos',
          'evmosdev',
          'evmosdevci',
          'fxcore',
          'haqq',
          'humans',
          'imversed',
          'injective',
          'lambda',
          'logos',
          'mythos',
          'okexchain',
          'planq',
          'point',
          'realio',
          'tenet',
          'uptick',
          'xpla',
          'zetachain'
          )`,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 459 WHERE "cosmos_chain_id" IN ('kava')`,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 880 WHERE "cosmos_chain_id" IN ('lumnetwork')`,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 529 WHERE "cosmos_chain_id" IN ('secretnetwork')`,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 330 WHERE "cosmos_chain_id" IN ('terra', 'terra2')`,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 370 WHERE "cosmos_chain_id" IN ('vidulum')`,
        { transaction: t },
      );

      // set all remaining chain nodes slip44 to 118 if they have cosmos_chain_id and no slip44 yet
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET slip44 = 118 WHERE "cosmos_chain_id" IS NOT NULL AND slip44 IS NULL`,
        { transaction: t },
      );

      // fix typo for planq
      await queryInterface.sequelize.query(
        `UPDATE "Communities" set "bech32_prefix" = 'plq' where id = 'planq';`,
        { transaction: t },
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainNodes', 'slip44', {
        transaction: t,
      });
    });
  },
};
