'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'plasm',
        symbol: 'PLM',
        name: 'Plasm Network',
        icon_url: '/static/img/protocols/plm.png',
        type: 'chain',
        network: 'plasm',
        active: true,
        description: 'A leading scalable smart contract platform on Polkadot supporting '
          + 'cutting edge Layer 2 such as Plasma and Rollups.',
        telegram: 'https://t.me/PlasmOfficial',
        website: 'https://www.plasmnet.io/',
        chat: 'https://discord.com/invite/Dnfn5eT',
        github: 'https://github.com/staketechnologies/Plasm',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'plasm',
        url: 'wss://rpc.plasmnet.io/',
      }], { transaction: t });

      // TODO: add plasm event types
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['plasm'] }, { transaction: t });
    });
  }
};
