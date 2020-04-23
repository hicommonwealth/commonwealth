'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

// TODO: if we can use typescript in migrations, we can simply get these
//   from the shared/events/edgeware/types file.
const substrateEventStrings = [
  'slash',
  'reward',
  'bonded',
  'unbonded',
  'vote-delegated',
  'democracy-proposed',
  'democracy-started',
  'democracy-passed',
  'democracy-not-passed',
  'democracy-cancelled',
  'democracy-executed',
  'treasury-proposed',
  'treasury-awarded',
  'treasury-rejected',
];

const initChainEventTypes = (queryInterface, Sequelize, t) => {
  const buildObject = (event_name, chain) => ({
    id: `${chain}-${event_name}`,
    chain,
    event_name,
  });
  const edgewareObjs = substrateEventStrings.map((s) => buildObject(s, 'edgeware'));

  // TODO: somehow switch this on for testing purposes?
  // const edgewareLocalObjs = substrateEventStrings.map((s) => buildObject(s, 'edgeware-local'));
  return queryInterface.bulkInsert(
    'ChainEventTypes',
    [
      ...edgewareObjs,
    //  ...edgewareLocalObjs
    ],
    { transaction: t }
  );
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('ChainEventTypes', {
        id: { type: Sequelize.STRING, primaryKey: true },
        chain: {
          type: Sequelize.STRING,
          allowNull: false,
          references: { model: 'Chains', key: 'id' },
        },
        event_name: { type: Sequelize.STRING, allowNull: false },
      }, {
        transaction: t,
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['id'] },
          { fields: ['chain', 'event_name'] },
        ]
      });

      await queryInterface.createTable('ChainEvents', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        chain_event_type_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: { model: 'ChainEventTypes', key: 'id' },
        },
        block_number: { type: Sequelize.INTEGER, allowNull: false },
        event_data: { type: Sequelize.JSONB, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, {
        transaction: t,
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['id'] },
          { fields: ['block_number', 'chain_event_type_id'] },
        ]
      });

      // add association on notifications
      await queryInterface.addColumn('Notifications', 'chain_event_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ChainEvents', key: 'id' },
      }, { transaction: t });

      // add type to NotificationCategories
      await queryInterface.bulkInsert('NotificationCategories', [{
        name: 'chain-event',
        description: 'a chain event occurs'
      }], { transaction: t });

      // TODO: TESTING ONLY
      // await queryInterface.bulkInsert('Chains', [{
      //   id: 'edgeware-local',
      //   network: 'edgeware',
      //   symbol: 'EDG',
      //   name: 'Edgeware Local',
      //   icon_url: '/static/img/protocols/edg.png',
      //   active: true,
      //   type: 'chain',
      // }], { transaction: t });
      // await queryInterface.bulkInsert('ChainNodes', [{
      //   chain: 'edgeware-local',
      //   url: 'localhost:9944',
      // }], { transaction: t });

      // initialize chain event types as needed
      await initChainEventTypes(queryInterface, Sequelize, t);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('Notifications', {
        chain_event_id: {
          [Op.ne]: null
        }
      }, { transaction: t });
      await queryInterface.bulkDelete('Subscriptions', {
        category_id: 'chain-event',
      }, { transaction: t });
      // remove type from NotificationCategories
      await queryInterface.bulkDelete('NotificationCategories', {
        name: 'chain-event',
      }, { transaction: t });

      // remove association from notifications
      await queryInterface.removeColumn('Notifications', 'chain_event_id', { transaction: t });

      // remove chain_event and chain_event_type tables
      await queryInterface.dropTable('ChainEvents', { transaction: t });
      await queryInterface.dropTable('ChainEventTypes', { transaction: t });
    });
  }
};
