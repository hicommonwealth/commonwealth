'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const chain = 'axie-infinity';
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain }, { transaction: t })
      await queryInterface.bulkDelete('OffchainThreads', { chain }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain }, { transaction: t });

      const toDelete = await queryInterface.sequelize.query(`SELECT id FROM "Addresses" WHERE chain = 'axie-infinity'`, { transaction: t });
      const ids = toDelete ? toDelete[0].map(({ id }) => id) : [];
      await queryInterface.bulkDelete('OffchainProfiles', { address_id: ids }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: [chain] }, { transaction: t });
      await queryInterface.bulkInsert('Chains', [{
        id: 'axie-infinity',
        symbol: 'RON',
        name: 'Axie Infinity',
        type: 'offchain',
        network: 'axie-infinity',
        base: 'ethereum',
        active: true,
        description: 'TODO',
      }], { transaction: t, logging: console.log });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'axie-infinity',
        url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr', // TODO: this is eth mainnet
        eth_chain_id: 2020, // ??
      }], { transaction: t });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'axie-infinity' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['axie-infinity'] }, { transaction: t });
    });
  }
};
