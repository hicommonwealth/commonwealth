'use strict';

const PlasmFutureEventKinds = {
  Slash: 'slash',
  Reward: 'reward',
  Bonded: 'bonded',
  Unbonded: 'unbonded',
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'plasm',
        symbol: 'PLM',
        name: 'Plasm Network',
        icon_url: '/static/img/protocols/plm.png',
        type: 'chain',
        network: 'plasm',
        active: true,
        description: 'A leading scalable smart contract platform on Polkadot supporting '
          + 'cutting edge Layer 2 such as Plasma and Rollups.',
        telegram: 'https://t.me/PlasmOfficial',
        website: 'https://www.plasmnet.io/',
        chat: 'https://discord.com/invite/Dnfn5eT',
        github: 'https://github.com/staketechnologies/Plasm',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'plasm',
        url: 'wss://rpc.plasmnet.io/',
      }], { transaction: t });

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const plasmObjs = Object.values(PlasmFutureEventKinds).map((s) => buildObject(s, 'plasm'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...plasmObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'plasm' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['plasm'] }, { transaction: t });
    });
  }
};
