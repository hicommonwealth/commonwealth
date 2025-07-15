'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      console.log('Removing subscriptions');
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'kulupu-bonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'kulupu-unbonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'kusama-bonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'kusama-unbonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'polkadot-bonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'polkadot-unbonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'edgeware-bonded' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        { object_id: 'edgeware-unbonded' },
        { transaction: t }
      );

      console.log('Adding index to chain events');
      await queryInterface.addIndex('Notifications', ['chain_event_id'], {
        transaction: t,
      });

      console.log('Removing chain events');
      await queryInterface.sequelize.query(
        `
DELETE FROM "ChainEvents" WHERE "ChainEvents".chain_event_type_id IN
('edgeware-unbonded', 'edgeware-bonded', 'polkadot-unbonded',
 'polkadot-bonded', 'kusama-unbonded', 'kusama-bonded');`,
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    // no-op
    return new Promise((resolve, reject) => resolve());
  },
};
