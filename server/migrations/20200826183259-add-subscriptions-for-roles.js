/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const users = await queryInterface.sequelize.query(
        `SELECT * FROM "Users";`,
        { transaction: t }
      );

      await Promise.all(
        users[0].map(async (user) => {
          const { id } = user;
          // Get all addresses for User
          const resAddresses = await queryInterface.sequelize.query(
            `SELECT * FROM "Addresses" WHERE user_id=${id};`,
            { transaction: t }
          );
          const addresses = resAddresses[0];
          const addressIds = addresses.map((a) => a.id);

          if (addressIds.length === 0) return;
          const addressRoles = await queryInterface.sequelize.query(
            `SELECT * FROM "Roles" WHERE address_id IN (${[...addressIds]});`,
            { transaction: t }
          );
          const userRoles = addressRoles[0];

          // Get all user subscriptions
          const subscriptions = await queryInterface.sequelize.query(
            `SELECT * FROM "Subscriptions" WHERE subscriber_id=${id};`
          );
          const existingSubscriptions = [];
          // Add subscriptions object_id to existingSubscriptions where not included already
          subscriptions[0].forEach((s) => {
            if (!existingSubscriptions.includes(s.object_id)) {
              existingSubscriptions.push(s.object_id);
            }
          });

          const communityIds = [];
          const chainIds = [];

          // For each role, check community/chain and if its already associated with an existingSubscription
          // If not, add to communityIds or chainIds respectively
          userRoles.forEach((r) => {
            if (
              r.offchain_community_id &&
              !communityIds.includes(r.offchain_community_id) &&
              !existingSubscriptions.includes(r.offchain_community_id)
            ) {
              communityIds.push(r.offchain_community_id);
            } else if (
              r.chain_id &&
              !chainIds.includes(r.chain_id) &&
              !existingSubscriptions.includes(r.chain_id)
            ) {
              chainIds.push(r.chain_id);
            }
          });

          // For each community where a user has a role but no subscription, add one.
          await Promise.all(
            communityIds.map(async (communityId) => {
              await queryInterface.sequelize.query(
                `INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, chain_id, community_id, created_at, updated_at) VALUES (${id}, 'new-thread-creation', '${communityId}', NULL, '${communityId}', NOW(), NOW());`,
                { transaction: t }
              );
            })
          );

          // For each chain where a user has a role but no subscription, add one.
          await Promise.all(
            chainIds.map(async (chainId) => {
              await queryInterface.sequelize.query(
                `INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, chain_id, community_id, created_at, updated_at) VALUES (${id}, 'new-thread-creation', '${chainId}', '${chainId}', NULL, NOW(), NOW());`,
                { transaction: t }
              );
            })
          );
        })
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([]);
    });
  },
};
