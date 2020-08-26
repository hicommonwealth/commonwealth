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
        console.log('addresses', addresses);
        const userRoles = [];

        // await Promise.all(addresses.map(async (address) => {
        //   const addressRoles = await queryInterface.sequelize.query(`SELECT * FROM "Roles" WHERE address_id=${address.id};`, { transaction: t, });
        //   addressRoles[0].forEach((r) => userRoles.push(r));
        // }));

        // console.log('User Roles', userRoles);

        // const communityIds = [];
        // const chainIds = [];

        // userRoles.forEach((r) => {
        //   if (r.offchain_community_id && !communityIds.includes(r.offchain_community_id)) {
        //     communityIds.push(r.offchain_community_id);
        //   } else if (r.chain_id && !chainIds.includes(r.chain_id)) {
        //     chainIds.push(r.chain_id);
        //   }
        // });

        // console.log("Community Ids", communityIds);
        // console.log("Chain Ids", chainIds);

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
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
