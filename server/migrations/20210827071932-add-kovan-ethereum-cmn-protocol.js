'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('CMNProtocol', [{
        id: 'kovan-ethereum-protocol',
        name: 'Kovan Ethereum CMN Protocol',
        project_protocol: '0x93AdF9e24Fda3C5F525A5eC1742DA227EfC51574',
        collective_protocol: '0xE08A86B417B90299d6dFD944F36dCd2613a49F72',
        chain: 'ethereum-kovan',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction: t });

      await queryInterface.bulkInsert('Addresses', [
        {
          address: '0x93AdF9e24Fda3C5F525A5eC1742DA227EfC51574',
          chain: 'ethereum-kovan',
          created_at: new Date(),
          updated_at: new Date(),
          verification_token: 'NO_USER',
          name: 'CMN Protocol Project Factory'
        },
        {
          address: '0xE08A86B417B90299d6dFD944F36dCd2613a49F72',
          chain: 'ethereum-kovan',
          created_at: new Date(),
          updated_at: new Date(),
          verification_token: 'NO_USER',
          name: 'CMN Protocol Collective Factory'
        },
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const removeChain = 'ethereum-kovan';
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
      await queryInterface.bulkDelete('CMNProtocol', { id: 'kovan-ethereum-protocol' }, { transaction: t });
    });
  }
};
