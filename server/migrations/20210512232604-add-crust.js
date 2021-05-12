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
      await queryInterface.bulkInsert('Chains', [{
        id: 'crust',
        symbol: 'CRUST',
        name: 'Crust',
        icon_url: '/static/img/protocols/dot.png', // @TODO: Add crust
        type: 'chain',
        network: 'crust',
        active: true,
        description: 'A Decentralized Cloud Blockchain Technology on Polkadot',
        telegram: 'https://t.me/CrustNetwork',
        website: 'https://crust.network/',
        chat: 'https://discord.com/invite/Jbw2PAUSCR',
        github: 'https://github.com/crustio',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'crust',
        url: 'wss://api.crust.network/',
      }], { transaction: t });

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const crustObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'stafi'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...crustObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'crust' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['crust'] }, { transaction: t });
    });
  }
};
