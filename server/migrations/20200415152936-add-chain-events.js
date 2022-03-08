'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

// TODO: if we can use typescript in migrations, we can simply get these
//   from the shared/commonwealth-chain-events/dist/src/substrate/types file.

const SubstrateEventKinds = {
  Slash: 'slash',
  Reward: 'reward',
  Bonded: 'bonded',
  Unbonded: 'unbonded',

  VoteDelegated: 'vote-delegated',
  DemocracyProposed: 'democracy-proposed',
  DemocracyTabled: 'democracy-tabled',
  DemocracyStarted: 'democracy-started',
  DemocracyPassed: 'democracy-passed',
  DemocracyNotPassed: 'democracy-not-passed',
  DemocracyCancelled: 'democracy-cancelled',
  DemocracyExecuted: 'democracy-executed',

  PreimageNoted: 'preimage-noted',
  PreimageUsed: 'preimage-used',
  PreimageInvalid: 'preimage-invalid',
  PreimageMissing: 'preimage-missing',
  PreimageReaped: 'preimage-reaped',

  TreasuryProposed: 'treasury-proposed',
  TreasuryAwarded: 'treasury-awarded',
  TreasuryRejected: 'treasury-rejected',

  ElectionNewTerm: 'election-new-term',
  ElectionEmptyTerm: 'election-empty-term',
  ElectionCandidacySubmitted: 'election-candidacy-submitted',
  ElectionMemberKicked: 'election-member-kicked',
  ElectionMemberRenounced: 'election-member-renounced',

  CollectiveProposed: 'collective-proposed',
  CollectiveVoted: 'collective-voted',
  CollectiveApproved: 'collective-approved',
  CollectiveDisapproved: 'collective-disapproved',
  CollectiveExecuted: 'collective-executed',
  CollectiveMemberExecuted: 'collective-member-executed',
  // TODO: do we want to track votes as events, in collective?

  SignalingNewProposal: 'signaling-new-proposal',
  SignalingCommitStarted: 'signaling-commit-started',
  SignalingVotingStarted: 'signaling-voting-started',
  SignalingVotingCompleted: 'signaling-voting-completed',
  // TODO: do we want to track votes for signaling?

  TreasuryRewardMinting: 'treasury-reward-minting',
  TreasuryRewardMintingV2: 'treasury-reward-minting-v2',
};

const initChainEventTypes = (queryInterface, Sequelize, t) => {
  const buildObject = (event_name, chain) => ({
    id: `${chain}-${event_name}`,
    chain,
    event_name,
  });
  const edgewareObjs = Object.values(SubstrateEventKinds).map((s) =>
    buildObject(s, 'edgeware')
  );

  // TODO: somehow switch this on for testing purposes?
  // const edgewareLocalObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'edgeware-local'));
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
      await queryInterface.createTable(
        'ChainEventTypes',
        {
          id: { type: Sequelize.STRING, primaryKey: true },
          chain: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          event_name: { type: Sequelize.STRING, allowNull: false },
        },
        {
          transaction: t,
          timestamps: false,
          underscored: true,
          indexes: [{ fields: ['id'] }, { fields: ['chain', 'event_name'] }],
        }
      );

      await queryInterface.createTable(
        'ChainEvents',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain_event_type_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'ChainEventTypes', key: 'id' },
          },
          block_number: { type: Sequelize.INTEGER, allowNull: false },
          event_data: { type: Sequelize.JSONB, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction: t,
          timestamps: true,
          underscored: true,
          indexes: [
            { fields: ['id'] },
            { fields: ['block_number', 'chain_event_type_id'] },
          ],
        }
      );

      // add association on notifications
      await queryInterface.addColumn(
        'Notifications',
        'chain_event_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'ChainEvents', key: 'id' },
        },
        { transaction: t }
      );

      // add type to NotificationCategories
      await queryInterface.bulkInsert(
        'NotificationCategories',
        [
          {
            name: 'chain-event',
            description: 'a chain event occurs',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t }
      );

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
      await queryInterface.bulkDelete(
        'Notifications',
        {
          chain_event_id: {
            [Op.ne]: null,
          },
        },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Subscriptions',
        {
          category_id: 'chain-event',
        },
        { transaction: t }
      );
      // remove type from NotificationCategories
      await queryInterface.bulkDelete(
        'NotificationCategories',
        {
          name: 'chain-event',
        },
        { transaction: t }
      );

      // remove association from notifications
      await queryInterface.removeColumn('Notifications', 'chain_event_id', {
        transaction: t,
      });

      // remove chain_event and chain_event_type tables
      await queryInterface.dropTable('ChainEvents', { transaction: t });
      await queryInterface.dropTable('ChainEventTypes', { transaction: t });
    });
  },
};
