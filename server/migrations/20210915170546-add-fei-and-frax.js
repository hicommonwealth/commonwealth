'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // TRIBE UPDATE
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'dao',
          network: 'compound',
          collapsed_on_homepage: false,
        },
        {
          id: 'tribe',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          address: '0xE087F94c3081e1832dC7a22B48c6f2b5fAaE579B',
        },
        {
          chain: 'tribe',
        },
        {
          transaction: t,
        }
      );

      // FRAX UPDATE
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'dao',
          network: 'compound',
          collapsed_on_homepage: false,
        },
        {
          id: 'frax',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          address: '0xd74034C6109A23B6c7657144cAcBbBB82BDCB00E',
        },
        {
          chain: 'frax',
        },
        {
          transaction: t,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // TRIBE UPDATE
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'token',
          network: 'tribe',
          collapsed_on_homepage: false,
        },
        {
          id: 'tribe',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          address: '0xc7283b66eb1eb5fb86327f08e1b5816b0720212b',
        },
        {
          chain: 'tribe',
        },
        {
          transaction: t,
        }
      );

      // FRAX UPDATE
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'token',
          network: 'frax',
          collapsed_on_homepage: false,
        },
        {
          id: 'frax',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          address: '0x853d955acef822db058eb8505911ed77f175b99e',
        },
        {
          chain: 'frax',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
