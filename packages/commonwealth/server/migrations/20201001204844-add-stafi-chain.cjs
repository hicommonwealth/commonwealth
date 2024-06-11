'use strict';

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
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'stafi',
            symbol: 'FIS',
            name: 'StaFi',
            icon_url: '/static/img/protocols/fis.png',
            type: 'chain',
            network: 'stafi',
            active: true,
            description:
              'An open-source DeFi protocol built to unlock the liquidity of staked assets',
            telegram: 'https://t.me/stafi_protocol',
            website: 'https://www.stafi.io/',
            chat: 'https://discord.com/invite/jB77etn',
            github: 'https://github.com/stafiprotocol/stafi-node',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'stafi',
            url: 'wss://scan-rpc.stafi.io/',
          },
        ],
        { transaction: t }
      );

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const stafiObjs = Object.values(SubstrateEventKinds).map((s) =>
        buildObject(s, 'stafi')
      );

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert('ChainEventTypes', [...stafiObjs], {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'stafi' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['stafi'] },
        { transaction: t }
      );
    });
  },
};
