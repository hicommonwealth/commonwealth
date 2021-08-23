'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add Chains and ChainNodes for cmn-protocol
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'cmn-protocol',
        name: 'CMN-Protocol(kovan)',
        symbol: 'CMN',
        icon_url: '/static/img/protocols/edg.png',
        active: true,
        network: 'ethereum',
        base: 'ethereum',
        type: 'chain',
        collapsed_on_homepage: true,
        customStages: true,
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'cmn-protocol',
        url: 'wss://kovan.infura.io/ws',
        address: '0x264cB0546D8d515b632DF3571Ef0b503855a3C77' // CWProjectFactory address on kovan network
      }], { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const removeChain = 'cmn-protocol';
      const addresses = await queryInterface.sequelize.query(
        `SELECT id, address, chain FROM "Addresses" WHERE chain='${removeChain}';`
      );
      const removeAddresses = [];
      for (const addr of addresses[0]) {
        const { id } = addr;
        removeAddresses.push(id);
      }

      const payload = removeAddresses.join(', ');
      await queryInterface.sequelize.query(`DELETE FROM "OffchainProfiles" WHERE address_id IN (${payload});`);
      await queryInterface.sequelize.query(`DELETE FROM "Roles" WHERE address_id IN (${payload});`);
      await queryInterface.sequelize.query(`DELETE FROM "Collaborations" WHERE address_id IN (${payload});`);

      const threads = await queryInterface.sequelize.query(
        `SELECT id FROM "OffchainThreads" WHERE address_id IN (${payload});`
      );
      const comments = await queryInterface.sequelize.query(
        `SELECT id FROM "OffchainComments" WHERE address_id IN (${payload});`
      );

      if (threads[0] && threads[0].length) {
        const threadIds = threads[0].map((_) => _.id).join(', ');
        await queryInterface.sequelize.query(`DELETE FROM "OffchainReactions" WHERE thread_id IN (${threadIds});`);
        await queryInterface.sequelize.query(`DELETE FROM "OffchainThreads" WHERE id IN (${threadIds});`);
      }

      if (comments[0] && comments[0].length) {
        const commentIds = comments[0].map((_) => _.id).join(', ');
        await queryInterface.sequelize.query(`DELETE FROM "OffchainReactions" WHERE comment_id IN (${commentIds});`);
        await queryInterface.sequelize.query(`DELETE FROM "OffchainComments" WHERE id IN (${commentIds});`);
      }

      await queryInterface.sequelize.query(`DELETE FROM "Addresses" WHERE id IN (${payload});`);
      await queryInterface.bulkDelete('ChainNodes', { chain: 'cmn-protocol' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['cmn-protocol'] }, { transaction: t });
    });
  }
};
