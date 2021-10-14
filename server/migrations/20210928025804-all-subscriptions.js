'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Users',
        [
          {
            email: 'notifications@commonwealth.im',
            created_at: Sequelize.literal('NOW()'),
            updated_at: Sequelize.literal('NOW()'),
          },
        ],
        { transaction: t }
      );
      const newSubscriptions = [];
      const user = await queryInterface.sequelize.query(
        `SELECT * FROM "Users" WHERE email='notifications@commonwealth.im';`,
        { transaction: t }
      );
      const { id: userId } = user[0][0];
      // Chain new-thread subscriptions
      const chains = await queryInterface.sequelize.query(
        'SELECT id FROM "Chains";',
        { transaction: t }
      );
      console.log('chains:', chains[0].length);

      for (const chain of chains[0]) {
        newSubscriptions.push({
          subscriber_id: userId,
          category_id: 'new-thread-creation',
          chain_id: chain.id,
          object_id: chain.id,
          is_active: true,
          created_at: Sequelize.literal('NOW()'),
          updated_at: Sequelize.literal('NOW()'),
        });
      }

      // OffchainCommunity new-thread subscriptions
      const offchainCommunities = await queryInterface.sequelize.query(
        'SELECT id FROM "OffchainCommunities";'
      );
      console.log('offchain communities:', offchainCommunities[0].length);
      for (const community of offchainCommunities[0]) {
        newSubscriptions.push({
          subscriber_id: userId,
          category_id: 'new-thread-creation',
          community_id: community.id,
          object_id: community.id,
          is_active: true,
          created_at: Sequelize.literal('NOW()'),
          updated_at: Sequelize.literal('NOW()'),
        });
      }

      // new-comment-creation (for every thread in every community)
      // const allThreads = await queryInterface.sequelize.query(
      //   'SELECT id, chain, community FROM "OffchainThreads";'
      // );
      // for (const thread of allThreads[0]) {
      //   const { id, chain, community } = thread;
      //   newSubscriptions.push(
      //     chain
      //       ? {
      //           subscriber_id: user.id,
      //           category_id: 'new-comment-creation',
      //           chain_id: chain,
      //           offchain_thread_id: id,
      //           object_id: null, // TODO: construct?
      //           is_active: true,
      //         }
      //       : {
      //           subscriber_id: user.id,
      //           category_id: 'new-comment-creation',
      //           community_id: community,
      //           offchain_thread_id: id,
      //           object_id: null, // TODO: construct?
      //           is_active: true,
      //         }
      //   );
      // }

      // For every ChainEventType, chain-event subscriptions
      const chainEventTypes = await queryInterface.sequelize.query(
        'SELECT id, chain FROM "ChainEventTypes";'
      );
      console.log('chain-event-types:', chainEventTypes[0].length);
      for (const type of chainEventTypes[0]) {
        console.log(type);
        newSubscriptions.push({
          subscriber_id: userId,
          category_id: 'chain-event',
          chain_id: type.chain,
          object_id: type.id,
          chain_event_type_id: type.id,
          is_active: true,
          created_at: Sequelize.literal('NOW()'),
          updated_at: Sequelize.literal('NOW()'),
        });
      }

      await queryInterface.bulkInsert('Subscriptions', newSubscriptions);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const user = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE email="notifications@commonwealth.im";`
      );

      const { id } = user[0][0];
      await queryInterface.bulkDelete(
        'Subscriptions',
        [
          {
            subscriber_id: id,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'Users',
        [
          {
            id,
          },
        ],
        { transaction: t }
      );
    });
  },
};
