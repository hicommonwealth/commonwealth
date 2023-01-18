'use strict';

const { Op } = require('sequelize');

const BountyEventKinds = {
  TreasuryBountyProposed: 'treasury-bounty-proposed',
  TreasuryBountyAwarded: 'treasury-bounty-awarded',
  TreasuryBountyRejected: 'treasury-bounty-rejected',
  TreasuryBountyBecameActive: 'treasury-bounty-became-active',
  TreasuryBountyClaimed: 'treasury-bounty-claimed',
  TreasuryBountyCanceled: 'treasury-bounty-canceled',
  TreasuryBountyExtended: 'treasury-bounty-extended',
};

const SubstrateChains = [
  'edgeware',
  'kusama',
  'polkadot',
  'darwinia',
  'stafi',
  'kulupu',
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });

      await SubstrateChains.forEach(async (c) => {
        const bountyObjs = Object.values(BountyEventKinds).map((s) =>
          buildObject(s, c)
        );
        await queryInterface.bulkInsert('ChainEventTypes', [...bountyObjs], {
          transaction: t,
        });
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        {
          event_name: {
            [Op.like]: '%treasury-bounty%',
          },
        },
        { transaction: t }
      );
    });
  },
};
