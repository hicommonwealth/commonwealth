'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'straightedge',
            symbol: 'STR',
            name: 'Straightedge',
            icon_url: '/static/img/protocols/str.png',
            type: 'chain',
            network: 'straightedge',
            active: true,
            description: 'A Cosmic smart contracting platform',
            website: 'https://www.straighted.ge/',
            chat: 'https://discord.com/invite/akVk9PT',
            github: 'https://github.com/heystraightedge/straightedge',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'straightedge',
            url: 'wss://straightedge.commonwealth.im',
          },
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'straightedge' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['straightedge'] },
        { transaction: t }
      );
    });
  },
};
