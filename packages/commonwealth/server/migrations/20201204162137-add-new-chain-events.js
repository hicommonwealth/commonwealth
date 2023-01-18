'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

const EventKinds = {
  DemocracySeconded: 'democracy-seconded',
  IdentitySet: 'identity-set',
  JudgementGiven: 'identity-judgement-given',
  IdentityCleared: 'identity-cleared',
  IdentityKilled: 'identity-killed',
  NewSession: 'new-session',
  AllGood: 'all-good',
  HeartbeatReceived: 'heartbeat-received',
  SomeOffline: 'some-offline',
  Offence: 'offences-offence',
  StakingElection: 'staking-election',
  DemocracyVoted: 'democracy-voted',
};

const EventChains = [
  'edgeware',
  'edgeware-local',
  'edgeware-testnet',
  'kusama',
  'kusama-local',
  'polkadot',
  'polkadot-local',
  'kulupu',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const buildObject = (event_name, chain) => ({
      id: `${chain}-${event_name}`,
      chain,
      event_name,
    });

    const [chains] = await queryInterface.sequelize.query(
      'SELECT * FROM "Chains"'
    );
    const eventSupportingChains = chains
      .map((c) => c.id)
      .filter((c) => EventChains.indexOf(c) !== -1);
    const objs = [];
    for (const c of eventSupportingChains) {
      const chainObjs = Object.values(EventKinds).map((s) => buildObject(s, c));
      objs.push(...chainObjs);
    }

    return queryInterface.bulkInsert('ChainEventTypes', objs);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ChainEventTypes', {
      event_name: { [Op.in]: Object.values(EventKinds) },
    });
  },
};
