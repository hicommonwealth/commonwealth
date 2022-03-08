'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainNodes',
        'token_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // add MPond token name for marlin
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          token_name: 'MPond',
        },
        {
          chain: 'marlin',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          token_name: 'MPond',
        },
        {
          chain: 'marlin-local',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          network: 'compound',
        },
        {
          id: 'marlin',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          network: 'compound',
        },
        {
          id: 'marlin-local',
        },
        {
          transaction: t,
        }
      );

      // turn uniswap into a dao
      await queryInterface.bulkUpdate(
        'Chains',
        {
          icon_url: '/static/img/protocols/uni.png',
          type: 'dao',
          network: 'compound',
          collapsed_on_homepage: false,
        },
        {
          id: 'uniswap',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://mainnet.infura.io/ws',
          address: '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6', // Governance
          token_name: 'uni',
        },
        {
          chain: 'uniswap',
        },
        {
          transaction: t,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainNodes', 'token_name', {
        transaction: t,
      });

      await queryInterface.bulkUpdate(
        'Chains',
        {
          network: 'marlin',
        },
        {
          id: 'marlin',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          network: 'marlin',
        },
        {
          id: 'marlin-local',
        },
        {
          transaction: t,
        }
      );

      // make uniswap a token again
      await queryInterface.bulkUpdate(
        'Chains',
        {
          icon_url: null,
          type: 'token',
          network: 'ethereum',
          collapsed_on_homepage: true,
        },
        {
          id: 'uniswap',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://mainnet.infura.io/ws',
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // token
        },
        {
          chain: 'uniswap',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
