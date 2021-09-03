'use strict';

const { checkAddress, decodeAddress, encodeAddress } = require('@polkadot/util-crypto');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const addresses = await queryInterface.sequelize.query(
        'SELECT id, address, chain FROM "Addresses";',
        { transaction },
      );
      const chains = await queryInterface.sequelize.query(
        'SELECT id, network, base, ss58_prefix FROM "Chains";',
        { transaction },
      );
      const promises = [];
      const updateAddressIds = {};

      for (const addr of addresses[0]) {
        const { id, address, chain } = addr;
        const ch = chains[0].find((_) => _.network === chain);
        if (ch && ch.base === 'substrate' && typeof ch.ss58_prefix === 'number') {
          let decodedAddress;
          try {
            decodedAddress = decodeAddress(address);
          } catch (e) {
            throw new Error('failed to decode address');
          }

          // check if it is valid with the current prefix & reencode if needed
          const [valid] = checkAddress(address, ch.ss58_prefix);
          if (!valid) {
            try {
              const encoded = encodeAddress(decodedAddress, ch.ss58_prefix);
              const duplicated = await queryInterface.sequelize.query(
                `SELECT id FROM "Addresses" WHERE address='${encoded}' AND chain='${chain}';`,
                { transaction },
              );
              if (duplicated[0] && duplicated[0][0]?.id) {
                updateAddressIds[+id] = +duplicated[0][0].id;
              } else {
                promises.push(
                  queryInterface.sequelize.query(
                    'UPDATE "Addresses" SET address=:address WHERE id=:id;',
                    {
                      replacements: { id, address: encoded },
                      type: queryInterface.sequelize.QueryTypes.UPDATE,
                      transaction,
                    },
                  )
                );
              }
            } catch (e) {
              console.error(`failed to reencode address: ${address}`);
              console.error(e.message);
            }
          }
        }
      }

      for (const [toReplace, replaceWith] of Object.entries(updateAddressIds)) {
        console.log(`Replacing ${toReplace} with ${replaceWith}`);
        await queryInterface.sequelize.query(
          'UPDATE "Collaborations" SET address_id=:address WHERE address_id=:id;',
          { replacements: { id: toReplace, address: replaceWith, }, transaction, logging: console.log },
        );
        await queryInterface.sequelize.query(
          'DELETE FROM "OffchainProfiles" WHERE address_id=:id;',
          { replacements: { id: toReplace, }, transaction, logging: console.log },
        );

        // TODO: use higher of the two roles
        await queryInterface.sequelize.query(
          'UPDATE "Roles" SET address_id=:address WHERE address_id=:id;',
          { replacements: { id: toReplace, address: replaceWith }, transaction, logging: console.log },
        );

        const threads = await queryInterface.sequelize.query(
          'SELECT id FROM "OffchainThreads" WHERE address_id=:id;',
          { replacements: { id: toReplace }, transaction, logging: console.log },
        );
        const comments = await queryInterface.sequelize.query(
          'SELECT id FROM "OffchainComments" WHERE address_id=:id;',
          { replacements: { id: toReplace }, transaction, logging: console.log },
        );

        // TODO: delete subscriptions

        if (threads[0] && threads[0].length) {
          const threadIds = threads[0].map((_) => _.id).join(', ');
          await queryInterface.sequelize.query(
            `DELETE "OffchainReactions" WHERE thread_id IN (${threadIds});`,
            { transaction, logging: console.log },
          );
          await queryInterface.sequelize.query(
            `UPDATE "OffchainThreads" SET address_id=:address WHERE id IN (${threadIds});`,
            { replacements: { address: replaceWith, }, transaction, logging: console.log },
          );
        }

        if (comments[0] && comments[0].length) {
          const commentIds = comments[0].map((_) => _.id).join(', ');
          await queryInterface.sequelize.query(
            `DELETE "OffchainReactions" WHERE comment_id IN (${commentIds});`,
            { transaction, logging: console.log },
          );
          await queryInterface.sequelize.query(
            `UPDATE "OffchainComments" SET address_id=:address WHERE id IN (${commentIds});`,
            { replacements: { address: replaceWith, }, transaction, logging: console.log },
          );
        }

        await queryInterface.sequelize.query(
          'DELETE FROM "Addresses" WHERE id=:id;',
          { replacements: { id: toReplace }, transaction, logging: console.log },
        );
      }

      console.log('affected addresses count: ', promises.length);

      await Promise.all(promises);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([]);
  }
};
