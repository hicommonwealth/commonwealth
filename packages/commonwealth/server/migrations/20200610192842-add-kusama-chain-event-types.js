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
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const kusamaObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'kusama'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...kusamaObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainEventTypes', {
        chain: 'kusama',
      }, { transaction: t });
    });
  }
};
