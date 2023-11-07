'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // xDAI -> Gnosis
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Gnosis' WHERE id = 53;
      `, { transaction: t })

      // GoodDAO Governance -> Fuse Mainnet
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Fuse Mainnet' WHERE id = 1262;
      `, { transaction: t })
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'xDAI' WHERE id = 53;
      `, { transaction: t })

      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'GoodDAO Governance' WHERE id = 1262;
      `, { transaction: t })
    });
  }
};
