'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {

      // Add Columns
      await queryInterface.addColumn('ChainNodes', 'ss58', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'bech32', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction });


      // Add entry names
      const chainNodes = [{
        name: 'Ethereum',
        url: 'wss://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4'
      }];

      await Promise.all(chainNodes.map(async (cn) => {
        const query = `UPDATE "ChainNodes" SET name='${cn.name}' WHERE url='${cn.url}';`;
        queryInterface.sequelize.query(query, { transaction });
      }))

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`UPDATE "ChainNodes" SET name=NULL;`, { transaction });
      await queryInterface.sequelize.query(`UPDATE "ChainNodes" SET description=NULL;`, { transaction });
      await queryInterface.removeColumn('ChainNodes', 'ss58', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'bech32', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'created_at', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'updated_at', { transaction });
    });

  }
};
