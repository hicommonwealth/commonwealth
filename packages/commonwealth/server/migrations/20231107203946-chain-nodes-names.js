'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // xDAI -> Gnosis
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Gnosis' WHERE name = 'xDAI';
      `, { transaction: t })

      // GoodDAO Governance -> Fuse Mainnet
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Fuse Mainnet' WHERE name = 'GoodDAO Governance';
      `, { transaction: t })
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'xDAI' WHERE name = 'Gnosis';
      `, { transaction: t })

      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'GoodDAO Governance' WHERE name = 'Fuse Mainnet';
      `, { transaction: t })
    });
  }
};
