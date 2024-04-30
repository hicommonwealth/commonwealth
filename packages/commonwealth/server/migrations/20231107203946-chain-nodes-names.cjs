'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // xDAI -> Gnosis
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Gnosis' WHERE eth_chain_id = 100;
      `, { transaction: t })

      // GoodDAO Governance -> Fuse Mainnet
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'Fuse Mainnet' WHERE eth_chain_id = 122;
      `, { transaction: t })
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'xDAI' WHERE eth_chain_id = 100;
      `, { transaction: t })

      await queryInterface.sequelize.query(`
        UPDATE "ChainNodes" SET name = 'GoodDAO Governance' WHERE eth_chain_id = 122;
      `, { transaction: t })
    });
  }
};
