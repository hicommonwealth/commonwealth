'use strict';
import { NotificationCategories } from 'shared/types';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const user = await queryInterface.bulkInsert('Users', [{ 
            email: 'notifications@commonwealth.im',
            emailVerified: true,
            isAdmin: false,
            magicIssuer: false,
          }],
        { transaction: t }
      );
      const newSubscriptions = [];

      // Chain new-thread subscriptions
      const chains = await queryInterface.sequelize.query(
        'SELECT id FROM "Chains";',
        { transaction: t }
      );
      console.log('chains:', chains[0].length);

      for (const chain of chains[0]) {
        newSubscriptions.push({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewThread,
          chain_id: chain.id,
          object_id: chain.id,
          is_active: true,
        });
      }

      // OffchainCommunity new-thread subscriptions
      const offchainCommunities = await queryInterface.sequelize.query(
        'SELECT id FROM "OffchainCommunities;'
      );
      console.log('offchain communities:', offchainCommunities[0].length);
      for (const community of offchainCommunities[0]) {
        newSubscriptions.push({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewThread,
          community_id: community.id,
          object_id: community.id,
          is_active: true,
        });
      }

      // new-comment-creation (for every thread in every community)

      // For every ChainEventType, chain-event subscriptions
      const chainEventTypes = await queryInterface.sequelize.query(
        'SELECT id, chain FROM "ChainEventTypes";'
      );
      console.log('chain-event-types:', chainEventTypes[0].length);
      for (const type of chainEventTypes[0]) {
        newSubscriptions.push({
          subscriber_id: user.id,
          category_id: NotificationCategories.ChainEvent,
          chain_id: type.chain,
          object_id: type.chain,
          chain_event_type_id: type.id,
          is_active: true,
        });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('Users', [{
        email: 'notifications@commonwealth.im'
      }], { transaction: t });

      /* remove subscriptions owned by user*/ 
    });
  }
};
