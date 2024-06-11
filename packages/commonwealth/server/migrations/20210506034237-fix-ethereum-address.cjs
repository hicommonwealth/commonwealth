'use strict';

const Web3 = require('web3');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addresses = await queryInterface.sequelize.query(
      'SELECT id, address, chain FROM "Addresses";'
    );
    const chains = await queryInterface.sequelize.query(
      'SELECT id, network, base FROM "Chains";'
    );
    const promises = [];
    const removeAddressIds = [];

    for (const addr of addresses[0]) {
      const { id, address, chain } = addr;
      const ch = chains[0].find((_) => _.network === chain);
      if (ch && ch.base === 'ethereum') {
        if (!Web3.utils.checkAddressChecksum(address)) {
          const checksumAddress = Web3.utils.toChecksumAddress(address);
          const duplicated = await queryInterface.sequelize.query(
            `SELECT id FROM "Addresses" WHERE address='${checksumAddress}' AND chain='${chain}';`
          );
          if (duplicated[0] && duplicated[0].length) {
            removeAddressIds.push(id);
          } else {
            promises.push(
              queryInterface.sequelize.query(
                'UPDATE "Addresses" SET address=:address WHERE id=:id;',
                {
                  replacements: { id, address: checksumAddress },
                  type: queryInterface.sequelize.QueryTypes.UPDATE,
                }
              )
            );
          }
        }
      }
    }

    if (removeAddressIds.length) {
      const payload = removeAddressIds.join(', ');
      await queryInterface.sequelize.query(
        `DELETE FROM "OffchainProfiles" WHERE address_id IN (${payload});`
      );
      await queryInterface.sequelize.query(
        `DELETE FROM "Roles" WHERE address_id IN (${payload});`
      );
      await queryInterface.sequelize.query(
        `DELETE FROM "Collaborations" WHERE address_id IN (${payload});`
      );

      const threads = await queryInterface.sequelize.query(
        `SELECT id FROM "OffchainThreads" WHERE address_id IN (${payload});`
      );
      const comments = await queryInterface.sequelize.query(
        `SELECT id FROM "OffchainComments" WHERE address_id IN (${payload});`
      );

      if (threads[0] && threads[0].length) {
        const threadIds = threads[0].map((_) => _.id).join(', ');
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainReactions" WHERE thread_id IN (${threadIds});`
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainThreads" WHERE id IN (${threadIds});`
        );
      }

      if (comments[0] && comments[0].length) {
        const commentIds = comments[0].map((_) => _.id).join(', ');
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainReactions" WHERE comment_id IN (${commentIds});`
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainComments" WHERE id IN (${commentIds});`
        );
      }

      await queryInterface.sequelize.query(
        `DELETE FROM "Addresses" WHERE id IN (${payload});`
      );
    }

    console.log('affected addresses count: ', promises.length);

    await Promise.all(promises);
  },

  down: async (queryInterface, Sequelize) => {
    const addresses = await queryInterface.sequelize.query(
      'SELECT id, address, chain FROM "Addresses";'
    );
    const chains = await queryInterface.sequelize.query(
      'SELECT id, network, base FROM "Chains";'
    );
    const promises = [];

    for (const addr of addresses[0]) {
      const { id, address, chain } = addr;
      const ch = chains[0].find((_) => _.network === chain);
      if (ch && ch.base === 'ethereum') {
        promises.push(
          queryInterface.sequelize.query(
            'UPDATE "Addresses" SET address=:address WHERE id=:id;',
            {
              replacements: { id, address: address.toLowerCase() },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
            }
          )
        );
      }
    }

    console.log('affected addresses count: ', promises.length);

    await Promise.all(promises);
  },
};
