'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'xdc',
            default_symbol: 'XDC',
            name: 'XDC Mainnet',
            icon_url: '/static/img/protocols/xdc.png',
            type: 'chain',
            network: 'xdc-mainnet',
            base: 'ethereum',
            active: true,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            balance_type: 'ethereum',
            url: 'https://rpc.xinfin.network',
            alt_wallet_url: 'https://rpc.xinfin.network',
            name: 'XDC Mainnet',
            eth_chain_id: 50,
          },
        ],
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { url: 'https://rpc.xinfin.network' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['xdc'] },
        { transaction: t }
      );
    });
  },
};
