/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {

      const users = await queryInterface.sequelize.query(`SELECT * FROM "Users";`, { transaction: t, });

      await Promise.all(users[0].map(async (user) => {
        const { id, } = user;
        const resAddresses = await queryInterface.sequelize.query(`SELECT * FROM "Addresses" WHERE user_id=${id};`, { transaction: t, });
        const addresses = resAddresses[0];
        // console.log('addresses', addresses.length);
        const userRoles = [];

        await Promise.all(addresses.map(async (address) => {
          const addressRoles = await queryInterface.sequelize.query(`SELECT * FROM "Roles" WHERE address_id=${address.id};`, { transaction: t, });
          // console.log('roles', addressRoles[0].length);
          addressRoles[0].forEach((r) => userRoles.push(r));
        }));

        // console.log('User Roles', userRoles);

        const subscriptions = await queryInterface.sequelize.query(`SELECT * FROM "Subscriptions" WHERE subscriber_id=${id};`);
        const existingSubscriptions = [];
        subscriptions[0].forEach((s) => {
          if (!existingSubscriptions.includes(s.object_id)) {
            existingSubscriptions.push(s.object_id);
          }
        });
        // console.log('existingSubscriptions', existingSubscriptions);

        const communityIds = [];
        const chainIds = [];

        userRoles.forEach((r) => {
          if (r.offchain_community_id && !communityIds.includes(r.offchain_community_id) && !existingSubscriptions.includes(r.offchain_community_id)) {
            communityIds.push(r.offchain_community_id);
          } else if (r.chain_id && !chainIds.includes(r.chain_id) && !existingSubscriptions.includes(r.chain_id)) {
            chainIds.push(r.chain_id);
          }
        });

        // console.log("Community Ids", communityIds);
        // console.log("Chain Ids", chainIds);

        if (communityIds.length + chainIds.length > 0) {
          console.log('user id', id);
          console.log('userRoles', userRoles);
          console.log('subscriptions', existingSubscriptions);
          console.log('community Ids', communityIds);
          console.log('chain ids', chainIds);
        }
        // await Promise.all(communityIds.map(async (communityId) => {
        //   await queryInterface.sequelize.query(`INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, chain_id, community_id) VALUES (${id}, 'new-thread-creation', '${communityId}', NULL, '${communityId}');`)
        // }));

        // await Promise.all(chainIds.map(async (chainId) => {
        //   await queryInterface.sequelize.query(`INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, chain_id, community_id) VALUES (${id}, 'new-thread-creation', '${chainId}', '${chainId}', NULL);`)
        // }));
      }));
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([]);
    });
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
