'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'codame.sputnik-dao.near',
        symbol: 'NEAR',
        name: 'Sputnik Dao',
        icon_url: '/static/img/protocols/near.png',
        type: 'dao',
        network: 'sputnik',
        base: 'near',
        active: true,
        description: '',
        website: '',
        discord: '',
        github: '',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'codame.sputnik-dao.near',
        url: 'https://rpc.mainnet.near.org',
      }], { transaction: t });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'codame.sputnik-dao.near' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['codame.sputnik-dao.near'] }, { transaction: t });
    });
  }
};
